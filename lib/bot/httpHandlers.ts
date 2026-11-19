import { getAsciiSceneInventory } from './asciiScenes';
import { cleanupExpiredAnimations, processTelegramUpdate, type TelegramUpdate } from './botEngine';
import { isUpstashConfigured } from './redis';
import { isBotTokenConfigured, tgGetMe, tgSetMyCommands, tgSetWebhook } from './telegramApi';

export interface HttpHandlerResult {
  status: number;
  body: Record<string, unknown>;
}

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const lower = name.toLowerCase();
  const raw = headers[lower] ?? headers[name];
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function handleBotHealth(): Promise<HttpHandlerResult> {
  return {
    status: 200,
    body: {
      ok: true,
      service: 'АЛЛО, РОУД! — ASCII CHAOS Telegram Bot',
      database: isUpstashConfigured() ? 'upstash_redis' : 'local_fallback',
      telegramConfigured: isBotTokenConfigured(),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      asciiScenes: getAsciiSceneInventory(),
      serverTime: new Date().toISOString(),
    },
  };
}

export async function handleTelegramBotWebhook(
  headers: Record<string, string | string[] | undefined>,
  body: unknown
): Promise<HttpHandlerResult> {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (expectedSecret) {
    const actualSecret = readHeader(headers, 'x-telegram-bot-api-secret-token');
    if (actualSecret !== expectedSecret) {
      return { status: 401, body: { ok: false, error: 'Invalid webhook secret token' } };
    }
  }

  const update = (body || {}) as TelegramUpdate;
  if (!update || (typeof update.update_id !== 'number' && !update.message && !update.callback_query)) {
    return { status: 400, body: { ok: false, error: 'Invalid Telegram Update payload' } };
  }

  const result = await processTelegramUpdate(update);
  return {
    status: 200,
    body: result,
  };
}

export async function handleSetupWebhook(
  headers: Record<string, string | string[] | undefined>,
  queryOrBody: Record<string, unknown> = {}
): Promise<HttpHandlerResult> {
  const expectedSecret = (process.env.ADMIN_SETUP_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (expectedSecret) {
    const provided =
      readHeader(headers, 'x-setup-secret') ||
      readHeader(headers, 'authorization')?.replace(/^Bearer\s+/i, '') ||
      (typeof queryOrBody.secret === 'string' ? queryOrBody.secret : '');
    if (provided !== expectedSecret) {
      return { status: 401, body: { ok: false, error: 'Unauthorized setup request' } };
    }
  }

  if (!isBotTokenConfigured()) {
    return {
      status: 400,
      body: { ok: false, error: 'TELEGRAM_BOT_TOKEN is not set in environment variables' },
    };
  }

  const appUrl = (
    (typeof queryOrBody.appUrl === 'string' ? queryOrBody.appUrl : '') ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  ).replace(/\/+$/, '');

  if (!appUrl.startsWith('https://')) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'APP_URL must be an https:// URL for Telegram webhooks (e.g. https://your-app.vercel.app)',
      },
    };
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  const [meRes, hookRes, cmdsRes] = await Promise.all([
    tgGetMe(),
    tgSetWebhook({
      url: webhookUrl,
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined,
    }),
    tgSetMyCommands(),
  ]);

  return {
    status: hookRes.ok ? 200 : 502,
    body: {
      ok: hookRes.ok && cmdsRes.ok,
      bot: meRes.result || null,
      webhookUrl,
      setWebhook: hookRes,
      setMyCommands: cmdsRes,
    },
  };
}

export async function handleCleanupExpiredAnimations(
  headers: Record<string, string | string[] | undefined>
): Promise<HttpHandlerResult> {
  const expectedSecret = (process.env.CRON_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();
  if (expectedSecret) {
    const auth = readHeader(headers, 'authorization')?.replace(/^Bearer\s+/i, '');
    const headerSecret = readHeader(headers, 'x-telegram-bot-api-secret-token');
    if (auth !== expectedSecret && headerSecret !== expectedSecret) {
      return { status: 401, body: { ok: false, error: 'Unauthorized cleanup request' } };
    }
  }

  const result = await cleanupExpiredAnimations();
  return {
    status: 200,
    body: { ok: true, ...result },
  };
}
