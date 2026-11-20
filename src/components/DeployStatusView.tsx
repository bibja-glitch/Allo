import { useState, type FormEvent } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Send } from 'lucide-react';
import type { HealthResponse } from '../types/ui';

interface DeployStatusViewProps {
  health: HealthResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export function DeployStatusView({ health, loading, onRefresh }: DeployStatusViewProps) {
  const [appUrl, setAppUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [profileOnly, setProfileOnly] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deployResult, setDeployResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleDeploySync = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setDeployResult(null);

    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(secret.trim() ? { 'x-setup-secret': secret.trim() } : {}),
        },
        body: JSON.stringify({
          appUrl: appUrl.trim() || undefined,
          profileOnly,
          secret: secret.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        visualProfile?: { ok?: boolean; avatarFound?: boolean };
      };
      if (res.ok && json.ok) {
        setDeployResult({
          ok: true,
          message: 'Фото профиля, минималистичное описание, команды и webhook синхронизированы.',
        });
        onRefresh();
      } else {
        setDeployResult({
          ok: false,
          message: json.error || 'Telegram API вернул ошибку или токен не задан в окружении.',
        });
      }
    } catch {
      setDeployResult({
        ok: false,
        message: 'Не удалось выполнить запрос к /api/telegram/setup.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Diagnostics Checklist */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-950">Диагностика системы</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Проверка токена, Redis, webhook и готовности аватара бота
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
        </div>

        <div className="mt-4 divide-y divide-zinc-100 rounded-md border border-zinc-200">
          {health?.checks?.length ? (
            health.checks.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 p-3.5">
                <div className="flex items-start gap-2.5">
                  {item.status === 'ok' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : item.status === 'fail' ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E5484D]" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-zinc-950">{item.label}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">{item.detail}</div>
                    {item.hint && (
                      <div className="mt-1 text-[11px] text-zinc-500">{item.hint}</div>
                    )}
                  </div>
                </div>
                <span
                  className={`font-mono text-xs shrink-0 ${
                    item.status === 'ok'
                      ? 'text-emerald-700'
                      : item.status === 'fail'
                        ? 'text-[#E5484D]'
                        : 'text-amber-700'
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-zinc-500">Загрузка статуса...</div>
          )}
        </div>

        {health?.botProfile && (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
            <div className="font-semibold text-zinc-950">Профиль, применяемый при деплое</div>
            <div className="mt-2 space-y-1.5">
              <div>
                <span className="text-zinc-500">Методы API:</span>{' '}
                <span className="font-mono">
                  setMyProfilePhoto · setMyShortDescription · setMyDescription · setMyCommands
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Короткое описание:</span>{' '}
                {health.botProfile.desiredShortDescription}
              </div>
              <div>
                <span className="text-zinc-500">Файл аватара:</span>{' '}
                <span className="font-mono">
                  {health.botProfile.avatarReady ? 'готов к загрузке' : 'не найден'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Deploy-only Profile Sync Trigger */}
      <section className="rounded-lg border border-zinc-200 bg-white p-5 lg:col-span-5">
        <h3 className="font-display text-base font-bold text-zinc-950">
          Синхронизация при деплое
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          Аватар, описания и список команд обновляются строго при деплое (<code className="font-mono">npm run bot:deploy</code> или POST <code className="font-mono">/api/telegram/setup</code>) и не вызываются во время обычных сообщений.
        </p>

        <form onSubmit={handleDeploySync} className="mt-4 space-y-3.5">
          <div>
            <label htmlFor="deploy-app-url" className="block text-xs font-medium text-zinc-700">
              HTTPS URL приложения (для webhook)
            </label>
            <input
              id="deploy-app-url"
              type="url"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="deploy-secret" className="block text-xs font-medium text-zinc-700">
              Секрет настройки (если задан в env)
            </label>
            <input
              id="deploy-secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_SETUP_SECRET"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={profileOnly}
              onChange={(e) => setProfileOnly(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-950"
            />
            <span>Обновить только профиль бота (без изменения webhook)</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Отправка в Telegram API...' : 'Применить при деплое'}</span>
          </button>
        </form>

        {deployResult && (
          <div
            role="status"
            className={`mt-4 rounded-md border p-3 text-xs ${
              deployResult.ok
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {deployResult.message}
          </div>
        )}
      </section>
    </div>
  );
}
