import { getAsciiSceneById, getAsciiSceneInventory, renderAsciiSceneFrames } from './asciiScenes.js';
import { cleanupExpiredAnimations, processTelegramUpdate, type TelegramUpdate } from './botEngine.js';
import {
  BOT_COMMANDS,
  BOT_DESCRIPTION,
  BOT_SHORT_DESCRIPTION,
  syncBotVisualProfileOnDeploy,
} from './botProfile.js';
import { renderStatusHtml, runDiagnostics } from './diagnostics.js';
import { isUpstashConfigured } from './redis.js';
import {
  isBotTokenConfigured,
  tgGetMe,
  tgSetMyCommands,
  tgSetMyDescription,
  tgSetMyProfilePhoto,
  tgSetMyShortDescription,
  tgSetWebhook,
} from './telegramApi.js';

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

export async function handleStatusPage(): Promise<{ status: number; html: string }> {
  const report = await runDiagnostics();
  return { status: 200, html: renderStatusHtml(report) };
}

export async function handleBotHealth(): Promise<HttpHandlerResult> {
  const report = await runDiagnostics();
  return {
    status: 200,
    body: {
      ok: report.ok,
      checks: report.checks,
      expectedWebhookUrl: report.expectedWebhookUrl,
      botProfile: report.botProfile,
      service: 'АЛЛО, РОУД! — Telegram Bot',
      database: isUpstashConfigured() ? 'upstash_redis' : 'local_fallback',
      telegramConfigured: isBotTokenConfigured(),
      webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
      asciiScenes: getAsciiSceneInventory(),
      serverTime: new Date().toISOString(),
    },
  };
}

export async function handleScenesCatalog(query: Record<string, unknown> = {}): Promise<HttpHandlerResult> {
  const sceneId = typeof query.id === 'string' ? query.id : undefined;
  const winnerSide = query.side === 'right' ? 'right' : 'left';
  const fastMode = query.fast === 'true' || query.fast === '1';

  if (sceneId) {
    const scene = getAsciiSceneById(sceneId);
    if (!scene) {
      return { status: 404, body: { ok: false, error: 'Scene not found' } };
    }
    const frames = renderAsciiSceneFrames(scene, {
      winnerSide,
      winnerName: typeof query.winner === 'string' && query.winner ? query.winner : 'Кирилл',
      loserName: typeof query.loser === 'string' && query.loser ? query.loser : 'Денис',
      fastMode,
    });
    return {
      status: 200,
      body: {
        ok: true,
        scene: {
          id: scene.id,
          title: scene.title,
          type: scene.type,
          description: scene.description,
          frameDelayMs: scene.frameDelayMs,
        },
        frames,
      },
    };
  }

  return {
    status: 200,
    body: {
      ok: true,
      ...getAsciiSceneInventory(),
      profileTemplate: {
        shortDescription: BOT_SHORT_DESCRIPTION,
        description: BOT_DESCRIPTION,
        commands: BOT_COMMANDS,
      },
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

  try {
    const result = await processTelegramUpdate(update);
    return { status: 200, body: result };
  } catch (err) {
    console.error('Telegram webhook processing failed:', err);
    return { status: 500, body: { ok: false, error: 'Internal error while processing update' } };
  }
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

  const skipWebhook = queryOrBody.profileOnly === 'true' || queryOrBody.profileOnly === true;

  if (!skipWebhook && !appUrl.startsWith('https://')) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'APP_URL must be an https:// URL for Telegram webhooks (e.g. https://your-app.vercel.app)',
      },
    };
  }

  const webhookUrl = appUrl ? `${appUrl}/api/telegram/webhook` : null;

  const [meRes, hookRes, profileRes] = await Promise.all([
    tgGetMe(),
    webhookUrl
      ? tgSetWebhook({
          url: webhookUrl,
          secretToken: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined,
        })
      : Promise.resolve({ ok: true, result: true }),
    syncBotVisualProfileOnDeploy({
      setMyCommands: tgSetMyCommands,
      setMyDescription: tgSetMyDescription,
      setMyShortDescription: tgSetMyShortDescription,
      setMyProfilePhoto: tgSetMyProfilePhoto,
    }),
  ]);

  return {
    status: hookRes.ok ? 200 : 502,
    body: {
      ok: Boolean(hookRes.ok && profileRes.ok),
      bot: meRes.result || null,
      webhookUrl,
      setWebhook: hookRes,
      visualProfile: profileRes,
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

  try {
    const result = await cleanupExpiredAnimations();
    return { status: 200, body: { ok: true, ...result } };
  } catch (err) {
    console.error('Cleanup failed:', err);
    return { status: 500, body: { ok: false, error: 'Cleanup failed' } };
  }
}
