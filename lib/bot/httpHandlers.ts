import { computePlayerProgress } from '../../src/game/rules.js';
import type { PlayerProgress } from '../../src/types/game.js';
import { escapeHtml } from './asciiUtils.js';
import { getAsciiSceneById, getAsciiSceneInventory, renderAsciiSceneFrames } from './asciiScenes.js';
import { cleanupExpiredAnimations, processTelegramUpdate, type TelegramUpdate } from './botEngine.js';
import {
  BOT_COMMANDS,
  BOT_DESCRIPTION,
  BOT_SHORT_DESCRIPTION,
  syncBotVisualProfileOnDeploy,
} from './botProfile.js';
import { getDefaultBotStore, type BotStore, type PairContext } from './botStore.js';
import { renderStatusHtml, runDiagnostics } from './diagnostics.js';
import { buildUnpairedKeyboard } from './messages.js';
import { PIXEL_CHARACTER_MAP } from './pixelCharacters.js';
import { isUpstashConfigured } from './redis.js';
import { computeGameStats } from './stats.js';
import {
  isBotTokenConfigured,
  tgGetMe,
  tgSendMessage,
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
      service: 'АЛЛО, ПИДР! — Telegram Bot',
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

function serializePairState(ctx: PairContext, requestedViewerId?: string) {
  const pair = ctx.pair!;
  const players: PlayerProgress[] = ctx.members
    .slice()
    .sort((a, b) => a.lane_index - b.lane_index)
    .map((pm) => {
      const profile = ctx.profiles.find((p) => p.id === pm.user_id);
      if (!profile) return null;
      const conn = ctx.botConnections.find((b) => b.user_id === pm.user_id && b.notification_enabled);
      return computePlayerProgress({
        profile,
        laneIndex: pm.lane_index,
        events: ctx.events,
        finishThreshold: pair.finish_threshold,
        customRanks: pair.custom_ranks,
        botConnected: Boolean(conn),
        roundStartedAt: pair.round_started_at ?? null,
      });
    })
    .filter((p): p is PlayerProgress => Boolean(p));

  const validViewer =
    requestedViewerId && ctx.members.some((m) => m.user_id === requestedViewerId)
      ? requestedViewerId
      : players[0]?.userId || ctx.members[0]?.user_id || '';

  const stats = computeGameStats({
    pairId: pair.id,
    finishThreshold: pair.finish_threshold,
    events: ctx.events,
    members: ctx.members,
    profiles: ctx.profiles,
    customRanks: pair.custom_ranks,
    roundStartedAt: pair.round_started_at ?? null,
  });

  const viewerConn = ctx.botConnections.find((b) => b.user_id === validViewer);

  return {
    ok: true,
    pair,
    players,
    events: ctx.events.slice(0, 30),
    stats,
    viewerId: validViewer,
    viewerNotificationsEnabled: viewerConn?.notification_enabled ?? true,
  };
}

export async function handleGetPairState(
  query: Record<string, unknown> = {},
  deps: { store?: BotStore } = {}
): Promise<HttpHandlerResult> {
  const store = deps.store || getDefaultBotStore();
  const pairId = typeof query.pair === 'string' ? query.pair.trim() : '';
  const token = typeof query.token === 'string' ? query.token.trim() : '';
  const viewerId = typeof query.u === 'string' ? query.u.trim() : undefined;

  if (!pairId || !token) {
    return { status: 400, body: { ok: false, error: 'Не указаны параметры пары или токен.' } };
  }

  const ctx = await store.getPairContextById(pairId);
  if (!ctx.pair) {
    return { status: 404, body: { ok: false, error: 'Пара не найдена.' } };
  }
  if (!ctx.pair.web_token || ctx.pair.web_token !== token) {
    return { status: 403, body: { ok: false, error: 'Неверный ключ доступа к настройкам пары.' } };
  }

  return { status: 200, body: serializePairState(ctx, viewerId) };
}

export async function handleUpdatePairSettings(
  rawBody: unknown,
  deps: { store?: BotStore } = {}
): Promise<HttpHandlerResult> {
  const store = deps.store || getDefaultBotStore();
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;

  const pairId = typeof body.pairId === 'string' ? body.pairId.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const viewerId = typeof body.viewerId === 'string' ? body.viewerId.trim() : undefined;

  if (!pairId || !token) {
    return { status: 400, body: { ok: false, error: 'Не указаны pairId или token.' } };
  }

  const ctx = await store.getPairContextById(pairId);
  if (!ctx.pair) {
    return { status: 404, body: { ok: false, error: 'Пара не найдена.' } };
  }
  if (!ctx.pair.web_token || ctx.pair.web_token !== token) {
    return { status: 403, body: { ok: false, error: 'Неверный ключ доступа к настройкам пары.' } };
  }

  const memberIds = new Set(ctx.members.map((m) => m.user_id));

  if (Array.isArray(body.players)) {
    for (const entry of body.players) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const userId = typeof item.userId === 'string' ? item.userId.trim() : '';
      if (!userId || !memberIds.has(userId)) continue;

      const cleanName =
        typeof item.displayName === 'string'
          ? item.displayName.replace(/\s+/g, ' ').trim().slice(0, 24)
          : undefined;
      const pixelCharacter =
        typeof item.pixelCharacter === 'string' && item.pixelCharacter in PIXEL_CHARACTER_MAP
          ? item.pixelCharacter
          : undefined;

      if ((cleanName && cleanName.length > 0) || pixelCharacter) {
        await store.updateUserProfile({
          userId,
          displayName: cleanName && cleanName.length > 0 ? cleanName : undefined,
          pixelCharacter,
        });
      }
    }
  }

  const effectiveViewer =
    viewerId && memberIds.has(viewerId) ? viewerId : ctx.members[0]?.user_id || '';

  const finishThreshold =
    typeof body.finishThreshold === 'number' && Number.isFinite(body.finishThreshold)
      ? Math.min(100, Math.max(3, Math.round(body.finishThreshold)))
      : undefined;

  const cooldownSeconds =
    typeof body.cooldownSeconds === 'number' && Number.isFinite(body.cooldownSeconds)
      ? Math.min(3600, Math.max(0, Math.round(body.cooldownSeconds)))
      : undefined;

  const fastAnimation =
    typeof body.fastAnimation === 'boolean' ? body.fastAnimation : undefined;

  const notificationEnabled =
    typeof body.notificationEnabled === 'boolean' ? body.notificationEnabled : undefined;

  const resetRound = body.resetRound === true;

  await store.updateSettings({
    userId: effectiveViewer,
    pairId,
    finishThreshold,
    cooldownSeconds,
    fastAnimation,
    notificationEnabled,
    roundStartedAt: resetRound ? new Date().toISOString() : undefined,
  });

  const refreshed = await store.getPairContextById(pairId);
  return { status: 200, body: serializePairState(refreshed, effectiveViewer) };
}

export async function handleLeavePair(
  rawBody: unknown,
  deps: { store?: BotStore } = {}
): Promise<HttpHandlerResult> {
  const store = deps.store || getDefaultBotStore();
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;

  const pairId = typeof body.pairId === 'string' ? body.pairId.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const viewerId = typeof body.viewerId === 'string' ? body.viewerId.trim() : undefined;

  if (!pairId || !token) {
    return { status: 400, body: { ok: false, error: 'Не указаны pairId или token.' } };
  }

  const ctx = await store.getPairContextById(pairId);
  if (!ctx.pair) {
    return { status: 404, body: { ok: false, error: 'Пара не найдена.' } };
  }
  if (!ctx.pair.web_token || ctx.pair.web_token !== token) {
    return { status: 403, body: { ok: false, error: 'Неверный ключ доступа к настройкам пары.' } };
  }

  const memberIds = new Set(ctx.members.map((m) => m.user_id));
  const effectiveViewer =
    viewerId && memberIds.has(viewerId) ? viewerId : ctx.members[0]?.user_id || '';

  if (!effectiveViewer) {
    return { status: 400, body: { ok: false, error: 'В паре не найдены участники.' } };
  }

  const actorProfile = ctx.profiles.find((p) => p.id === effectiveViewer);
  const res = await store.leavePair(effectiveViewer);

  if (res.left && isBotTokenConfigured()) {
    const actorName = escapeHtml(actorProfile?.display_name || 'Участник');
    const noticeText = [
      `<b>${actorName}</b> вышел(а) из пары через настройки сайта.`,
      '',
      'Связка завершена — можно создать новую пару или ввести код от друга.',
    ].join('\n');

    const notifiedChats = new Set<string>();
    for (const conn of ctx.botConnections) {
      if (conn.telegram_chat_id && !notifiedChats.has(conn.telegram_chat_id)) {
        notifiedChats.add(conn.telegram_chat_id);
        try {
          await tgSendMessage({
            chatId: conn.telegram_chat_id,
            text: noticeText,
            parseMode: 'HTML',
            replyMarkup: buildUnpairedKeyboard(),
          });
        } catch {
          // Best-effort notification only
        }
      }
    }
    if (ctx.pair.group_chat_id && !notifiedChats.has(ctx.pair.group_chat_id)) {
      try {
        await tgSendMessage({
          chatId: ctx.pair.group_chat_id,
          text: noticeText,
          parseMode: 'HTML',
          replyMarkup: buildUnpairedKeyboard(),
        });
      } catch {
        // Best-effort notification only
      }
    }
  }

  return { status: 200, body: { ok: true, left: res.left } };
}


