import { getAsciiSceneInventory } from './asciiScenes.js';
import { getRedisClient, hgetallHash, isUpstashConfigured } from './redis.js';
import { isBotTokenConfigured, tgGetMe, tgGetWebhookInfo } from './telegramApi.js';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  hint?: string;
}

export interface DiagnosticsReport {
  ok: boolean;
  checkedAt: string;
  expectedWebhookUrl: string | null;
  checks: DiagnosticCheck[];
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}: таймаут ${ms / 1000} с`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function errText(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 200);
}

export function resolveExpectedWebhookUrl(): string | null {
  const appUrl = (process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''))
    .trim()
    .replace(/\/+$/, '');
  return appUrl.startsWith('https://') ? `${appUrl}/api/telegram/webhook` : null;
}

function envCheck(
  id: string,
  name: string,
  required: boolean,
  hint: string
): DiagnosticCheck {
  const set = Boolean((process.env[name] || '').trim());
  return {
    id,
    label: `Переменная ${name}`,
    status: set ? 'ok' : required ? 'fail' : 'warn',
    detail: set ? 'задана' : required ? 'НЕ задана' : 'не задана (необязательно, но рекомендуется)',
    hint: set ? undefined : hint,
  };
}

export async function runDiagnostics(): Promise<DiagnosticsReport> {
  const checks: DiagnosticCheck[] = [];
  const expectedWebhookUrl = resolveExpectedWebhookUrl();

  // --- Переменные окружения ---
  checks.push(envCheck('env_token', 'TELEGRAM_BOT_TOKEN', true, 'Получите токен у @BotFather и добавьте в переменные окружения.'));
  checks.push(envCheck('env_redis_url', 'UPSTASH_REDIS_REST_URL', true, 'Upstash Console → ваша база → REST API.'));
  checks.push(envCheck('env_redis_token', 'UPSTASH_REDIS_REST_TOKEN', true, 'Upstash Console → ваша база → REST API.'));
  checks.push(
    expectedWebhookUrl
      ? { id: 'env_app_url', label: 'Публичный HTTPS-адрес (APP_URL)', status: 'ok', detail: expectedWebhookUrl.replace('/api/telegram/webhook', '') }
      : {
          id: 'env_app_url',
          label: 'Публичный HTTPS-адрес (APP_URL)',
          status: 'fail',
          detail: 'не задан или не https://',
          hint: 'Укажите APP_URL=https://ваш-домен — без него нельзя зарегистрировать webhook.',
        }
  );
  checks.push(envCheck('env_webhook_secret', 'TELEGRAM_WEBHOOK_SECRET', false, 'Без секрета любой может слать запросы на /api/telegram/webhook.'));
  checks.push(envCheck('env_cron_secret', 'CRON_SECRET', false, 'Нужен, чтобы Vercel Cron мог вызывать /api/telegram/cleanup, если задан TELEGRAM_WEBHOOK_SECRET.'));

  // --- База данных (реальная запись/чтение/удаление) ---
  if (!isUpstashConfigured()) {
    checks.push({
      id: 'redis',
      label: 'База данных Upstash Redis',
      status: 'fail',
      detail: 'не подключена — используется память процесса (данные пропадают между запросами)',
      hint: 'Задайте UPSTASH_REDIS_REST_URL и UPSTASH_REDIS_REST_TOKEN.',
    });
  } else {
    try {
      const redis = getRedisClient();
      const key = `diagnostics:${Date.now()}`;
      const started = Date.now();
      await withTimeout(redis.set(key, 'ok', { ex: 30 }), 8000, 'Redis SET');
      const value = await withTimeout(redis.get<string>(key), 8000, 'Redis GET');
      await withTimeout(redis.del(key), 8000, 'Redis DEL');

      // Хэши — на них держатся пары, пользователи и события
      const hashKey = `${key}:hash`;
      await withTimeout(redis.hset(hashKey, { id: 'diag', status: 'ok' }), 8000, 'Redis HSET');
      const hash = await withTimeout(hgetallHash(redis, hashKey), 8000, 'Redis HGETALL');
      await withTimeout(redis.del(hashKey), 8000, 'Redis DEL');
      const ms = Date.now() - started;
      if (!hash || hash.id !== 'diag') {
        throw new Error(`хэши читаются неверно: ${JSON.stringify(hash)}`);
      }
      checks.push(
        String(value) === 'ok'
          ? { id: 'redis', label: 'База данных Upstash Redis', status: 'ok', detail: `запись, чтение и удаление работают (${ms} мс)` }
          : {
              id: 'redis',
              label: 'База данных Upstash Redis',
              status: 'fail',
              detail: `соединение есть, но чтение вернуло неожиданное значение: ${JSON.stringify(value)}`,
            }
      );
    } catch (err) {
      checks.push({
        id: 'redis',
        label: 'База данных Upstash Redis',
        status: 'fail',
        detail: errText(err),
        hint: 'Проверьте URL и токен (нужен REST URL и REST token, а не redis://) и что база не удалена.',
      });
    }
  }

  // --- Telegram: токен ---
  if (!isBotTokenConfigured()) {
    checks.push({
      id: 'tg_token',
      label: 'Telegram: токен бота',
      status: 'fail',
      detail: 'токен не задан',
      hint: 'Задайте TELEGRAM_BOT_TOKEN.',
    });
  } else {
    const me = await tgGetMe();
    checks.push(
      me.ok
        ? {
            id: 'tg_token',
            label: 'Telegram: токен бота',
            status: 'ok',
            detail: `бот @${me.result?.username ?? '?'} (${me.result?.first_name ?? ''})`,
          }
        : {
            id: 'tg_token',
            label: 'Telegram: токен бота',
            status: 'fail',
            detail: me.description || 'Telegram не принял токен',
            hint: 'Токен неверный или отозван — выпустите новый у @BotFather (/token).',
          }
    );

    // --- Telegram: webhook ---
    const info = await tgGetWebhookInfo();
    if (!info.ok) {
      checks.push({
        id: 'tg_webhook',
        label: 'Telegram: webhook',
        status: 'fail',
        detail: info.description || 'не удалось получить информацию о webhook',
      });
    } else {
      const current = (info.result?.url || '').replace(/\/+$/, '');
      const pending = info.result?.pending_update_count ?? 0;
      const lastErr = info.result?.last_error_message;
      const lastErrMs = (info.result?.last_error_date ?? 0) * 1000;
      const recentErr = Boolean(lastErr) && Date.now() - lastErrMs < 60 * 60 * 1000;

      if (!current) {
        checks.push({
          id: 'tg_webhook',
          label: 'Telegram: webhook',
          status: 'fail',
          detail: 'webhook НЕ зарегистрирован — Telegram не знает, куда слать сообщения',
          hint: 'Нажмите кнопку «Зарегистрировать webhook» ниже (или вызовите /api/telegram/setup).',
        });
      } else if (expectedWebhookUrl && current !== expectedWebhookUrl) {
        checks.push({
          id: 'tg_webhook',
          label: 'Telegram: webhook',
          status: 'fail',
          detail: `зарегистрирован другой адрес: ${current}`,
          hint: `Ожидается ${expectedWebhookUrl}. Нажмите «Зарегистрировать webhook», чтобы перезаписать.`,
        });
      } else if (recentErr) {
        checks.push({
          id: 'tg_webhook',
          label: 'Telegram: webhook',
          status: 'fail',
          detail: `адрес верный, но Telegram получает ошибку: ${lastErr} (${new Date(lastErrMs).toISOString()})`,
          hint: /401/.test(lastErr || '')
            ? 'Ответ 401: секрет в Telegram не совпадает с TELEGRAM_WEBHOOK_SECRET. Перерегистрируйте webhook.'
            : /5\d\d/.test(lastErr || '')
              ? 'Ошибка сервера: смотрите логи функции /api/telegram/webhook (Vercel → Logs).'
              : 'Проверьте логи функции и доступность адреса из интернета.',
        });
      } else {
        checks.push({
          id: 'tg_webhook',
          label: 'Telegram: webhook',
          status: pending > 20 ? 'warn' : 'ok',
          detail: `${current}${pending ? ` · в очереди обновлений: ${pending}` : ' · очередь пуста'}`,
          hint: pending > 20 ? 'Накопилась очередь — бот не успевает отвечать или отвечает ошибкой.' : undefined,
        });
      }
    }
  }

  // --- Каталог сцен ---
  const scenes = getAsciiSceneInventory();
  checks.push({
    id: 'scenes',
    label: 'ASCII-сцены',
    status: scenes.totalScenes >= 30 ? 'ok' : 'warn',
    detail: `загружено сцен: ${scenes.totalScenes}`,
  });

  return {
    ok: checks.every((c) => c.status !== 'fail'),
    checkedAt: new Date().toISOString(),
    expectedWebhookUrl,
    checks,
  };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderStatusHtml(report: DiagnosticsReport): string {
  const icon: Record<CheckStatus, string> = { ok: '✅', warn: '⚠️', fail: '❌' };
  const rows = report.checks
    .map(
      (c) => `<li class="${c.status}">
  <span class="ico">${icon[c.status]}</span>
  <div><div class="lbl">${esc(c.label)}</div>
  <div class="det">${esc(c.detail)}</div>
  ${c.hint ? `<div class="hint">💡 ${esc(c.hint)}</div>` : ''}</div>
</li>`
    )
    .join('\n');
  const failed = report.checks.filter((c) => c.status === 'fail').length;
  const warned = report.checks.filter((c) => c.status === 'warn').length;
  const summary = report.ok
    ? warned > 0
      ? `Всё работает, есть предупреждения: ${warned}`
      : 'Всё работает — бот готов к игре'
    : `Есть проблемы: ${failed}. Бот не будет работать, пока они не исправлены`;

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>АЛЛО, РОУД! — статус бота</title>
<style>
  :root{color-scheme:light dark;--bg:#fff;--fg:#1a1a1a;--card:#f5f5f7;--mut:#666;--ok:#1a7f37;--warn:#9a6700;--fail:#cf222e}
  @media (prefers-color-scheme:dark){:root{--bg:#0e1116;--fg:#e6edf3;--card:#161b22;--mut:#8b949e;--ok:#3fb950;--warn:#d29922;--fail:#f85149}}
  body{margin:0;padding:24px;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
  .wrap{max-width:760px;margin:0 auto}
  h1{font-size:20px;margin:0 0 4px}
  .sum{padding:12px 14px;border-radius:10px;margin:14px 0;font-weight:600;background:var(--card);border-left:5px solid var(--${report.ok ? (warned ? 'warn' : 'ok') : 'fail'})}
  ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  li{display:flex;gap:12px;padding:12px 14px;background:var(--card);border-radius:10px}
  .ico{font-size:18px}.lbl{font-weight:600}.det{color:var(--mut);word-break:break-word}
  .hint{margin-top:4px}li.fail .det{color:var(--fail)}li.warn .det{color:var(--warn)}li.ok .det{color:var(--ok)}
  .bar{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
  button,a.btn{font:inherit;padding:9px 14px;border-radius:8px;border:1px solid var(--mut);background:var(--card);color:var(--fg);cursor:pointer;text-decoration:none}
  pre{white-space:pre-wrap;background:var(--card);padding:10px;border-radius:8px;display:none}
  .time{color:var(--mut);font-size:13px}
</style></head><body><div class="wrap">
<h1>🕹️ АЛЛО, РОУД! — статус Telegram-бота</h1>
<div class="time">Проверено: ${esc(report.checkedAt)}</div>
<div class="sum">${report.ok ? (warned ? '⚠️' : '✅') : '❌'} ${esc(summary)}</div>
<ul>
${rows}
</ul>
<div class="bar">
  <button onclick="location.reload()">🔄 Проверить снова</button>
  <button id="setup">🔗 Зарегистрировать webhook</button>
  <a class="btn" href="?format=json">{ } JSON</a>
</div>
<pre id="out"></pre>
</div>
<script>
document.getElementById('setup').addEventListener('click', async () => {
  const out = document.getElementById('out');
  const secret = prompt('Секрет для настройки (ADMIN_SETUP_SECRET или TELEGRAM_WEBHOOK_SECRET). Если не задан — оставьте пустым:') || '';
  out.style.display = 'block'; out.textContent = 'Отправляю запрос…';
  try {
    const r = await fetch('/api/telegram/setup', { method: 'POST', headers: secret ? { 'x-setup-secret': secret } : {} });
    out.textContent = JSON.stringify(await r.json(), null, 2);
    setTimeout(() => location.reload(), 2500);
  } catch (e) { out.textContent = 'Ошибка: ' + e; }
});
</script></body></html>`;
}
