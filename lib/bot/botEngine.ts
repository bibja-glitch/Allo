import {
  computePlayerProgress,
  validateEventCreation,
  validateEventTransition,
} from '../../src/game/rules';
import type { CallEvent, PlayerProgress } from '../../src/types/game';
import {
  ASCII_GAMEOVER_SCENE,
  pickRandomAsciiScene,
  renderAsciiSceneFrames,
  type AsciiSceneDefinition,
} from './asciiScenes';
import { wrapPreHtml } from './asciiUtils';
import { getDefaultBotStore, type BotStore, type PairContext } from './botStore';
import {
  buildDisputedEventKeyboard,
  buildEventReactionKeyboard,
  buildGameOverKeyboard,
  buildMainMenuKeyboard,
  buildSettingsKeyboard,
  buildUnpairedKeyboard,
  formatGameOverMessage,
  formatHistoryMessage,
  formatPermanentShameMessage,
  formatScoreMessage,
  formatScoreboardLine,
  formatSettingsMessage,
  formatWelcomeActiveMessage,
  type InlineKeyboardMarkup,
} from './messages';
import {
  tgAnswerCallbackQuery,
  tgDeleteMessage,
  tgEditMessageText,
  tgSendMessage,
  type TelegramApiResponse,
  type TelegramSentMessage,
} from './telegramApi';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramTransport {
  sendMessage(params: {
    chatId: string | number;
    text: string;
    parseMode?: 'HTML';
    replyMarkup?: InlineKeyboardMarkup;
  }): Promise<TelegramApiResponse<TelegramSentMessage>>;
  editMessageText(params: {
    chatId: string | number;
    messageId: string | number;
    text: string;
    parseMode?: 'HTML';
    replyMarkup?: InlineKeyboardMarkup;
  }): Promise<TelegramApiResponse<TelegramSentMessage>>;
  deleteMessage(
    chatId: string | number,
    messageId: string | number
  ): Promise<TelegramApiResponse<boolean>>;
  answerCallbackQuery(params: {
    callbackQueryId: string;
    text?: string;
    showAlert?: boolean;
  }): Promise<TelegramApiResponse<boolean>>;
}

export interface BotEngineDeps {
  store?: BotStore;
  transport?: TelegramTransport;
  /** Override pause between ASCII frames in ms (defaults to scene.frameDelayMs, 950ms). */
  frameDelayMs?: number;
  /** Override final FATALITY frame hold duration in ms (defaults to 1200ms). */
  finalFrameHoldMs?: number;
  sleep?: (ms: number) => Promise<void>;
  randomFn?: () => number;
}

const defaultTransport: TelegramTransport = {
  sendMessage: tgSendMessage,
  editMessageText: tgEditMessageText,
  deleteMessage: tgDeleteMessage,
  answerCallbackQuery: tgAnswerCallbackQuery,
};

function defaultSleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPlayersProgress(ctx: PairContext): PlayerProgress[] {
  if (!ctx.pair) return [];
  return ctx.members
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
        finishThreshold: ctx.pair!.finish_threshold,
        customRanks: ctx.pair!.custom_ranks,
        botConnected: Boolean(conn),
        roundStartedAt: ctx.pair!.round_started_at ?? null,
      });
    })
    .filter((p): p is PlayerProgress => Boolean(p));
}

function formatDisplayName(user: TelegramUser): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || 'Игрок';
}

function isGroupChat(chat: TelegramChat): boolean {
  return chat.type === 'group' || chat.type === 'supergroup';
}

export async function processTelegramUpdate(
  update: TelegramUpdate,
  deps: BotEngineDeps = {}
): Promise<{ ok: true; deduplicated?: boolean; action?: string }> {
  const store = deps.store || getDefaultBotStore();
  const transport = deps.transport || defaultTransport;
  const sleep = deps.sleep || defaultSleep;
  const randomFn = deps.randomFn || Math.random;

  if (typeof update.update_id === 'number') {
    const claimed = await store.claimWebhookUpdate(update.update_id);
    if (!claimed) {
      return { ok: true, deduplicated: true };
    }
  }

  // -------------------------------------------------------------------------
  // 1. Handle Inline Keyboard Callbacks
  // -------------------------------------------------------------------------
  if (update.callback_query) {
    const cb = update.callback_query;
    const tgUser = cb.from;
    const chat = cb.message?.chat;
    const chatId = chat ? String(chat.id) : String(tgUser.id);
    const data = (cb.data || '').trim();

    const profile = await store.upsertTelegramUser({
      telegramId: String(tgUser.id),
      privateChatId: chat && !isGroupChat(chat) ? String(chat.id) : undefined,
      displayName: formatDisplayName(tgUser),
      username: tgUser.username || null,
    });

    if (data === 'pair:create') {
      const ctx = await store.getPairContextForUser(profile.id);
      if (ctx.pair) {
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: `У тебя уже есть пара (код: ${ctx.pair.invitation_code})`,
        });
        return { ok: true, action: 'pair:already_exists' };
      }
      const pair = await store.createPair(profile.id, chat && isGroupChat(chat) ? chatId : null);
      await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: 'Пара создана!' });
      await transport.sendMessage({
        chatId,
        text: [
          '🎮 Игровая пара создана!',
          '',
          `🔑 Код приглашения: ${pair.invitation_code}`,
          '',
          'Перешли этот код другу. Друг должен открыть бота и отправить:',
          `/join ${pair.invitation_code}`,
          '',
          'Как только он подключится, на арене появятся два бойца!',
        ].join('\n'),
      });
      return { ok: true, action: 'pair:create' };
    }

    if (data === 'pair:join_prompt') {
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      await transport.sendMessage({
        chatId,
        text: '🔗 Отправь код приглашения от друга в формате:\n/join ALLO-XXXX\n\nИли просто вставь код (например, ALLO-7F3A) сюда сообщением.',
      });
      return { ok: true, action: 'pair:join_prompt' };
    }

    if (data === 'act:miss') {
      return await handleMissAction({
        store,
        transport,
        actorId: profile.id,
        sourceChatId: chatId,
        callbackQueryId: cb.id,
        idempotencyKey: `tg_upd_${update.update_id}`,
        frameDelayMs: deps.frameDelayMs,
        finalFrameHoldMs: deps.finalFrameHoldMs,
        sleep,
        randomFn,
      });
    }

    if (data === 'act:menu' || data === 'act:score' || data === 'act:history' || data === 'act:settings') {
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      const ctx = await store.getPairContextForUser(profile.id);
      if (!ctx.pair || ctx.pair.status !== 'active') {
        await sendNeedsPairMessage(transport, chatId, ctx.pair?.invitation_code);
        return { ok: true, action: data };
      }
      if (data === 'act:menu') {
        await sendMainMenu(transport, chatId, profile.id, ctx);
      } else if (data === 'act:score') {
        await sendScoreView(transport, chatId, profile.id, ctx);
      } else if (data === 'act:history') {
        await sendHistoryView(transport, chatId, ctx);
      } else if (data === 'act:settings') {
        await sendSettingsView(transport, chatId, profile.id, ctx);
      }
      return { ok: true, action: data };
    }

    // Confirm / Dispute / Cancel missed call event
    if (data.startsWith('confirm:') || data.startsWith('dispute:') || data.startsWith('cancel:')) {
      const [actionRaw, eventId] = data.split(':');
      if (
        (actionRaw === 'confirm' || actionRaw === 'dispute' || actionRaw === 'cancel') &&
        eventId
      ) {
        return await handleEventCallbackAction({
          store,
          transport,
          cb,
          userId: profile.id,
          action: actionRaw,
          eventId,
          fallbackChatId: chatId,
          frameDelayMs: deps.frameDelayMs,
          finalFrameHoldMs: deps.finalFrameHoldMs,
          sleep,
        });
      }
    }

    // Settings updates
    if (data.startsWith('set:')) {
      const ctx = await store.getPairContextForUser(profile.id);
      if (!ctx.pair) {
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: 'Сначала создай или прими приглашение в пару.',
          showAlert: true,
        });
        return { ok: true, action: 'set:no_pair' };
      }

      if (data.startsWith('set:threshold:')) {
        const val = Number(data.split(':')[2]);
        await store.updateSettings({ userId: profile.id, pairId: ctx.pair.id, finishThreshold: val });
        await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: `Финиш: ${val} шагов` });
      } else if (data.startsWith('set:cooldown:')) {
        const val = Number(data.split(':')[2]);
        await store.updateSettings({ userId: profile.id, pairId: ctx.pair.id, cooldownSeconds: val });
        await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: `Пауза: ${val} сек.` });
      } else if (data === 'set:notif:toggle') {
        const conn = ctx.botConnections.find((b) => b.user_id === profile.id);
        const nextVal = !(conn?.notification_enabled ?? true);
        await store.updateSettings({
          userId: profile.id,
          pairId: ctx.pair.id,
          notificationEnabled: nextVal,
        });
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: nextVal ? 'Уведомления включены' : 'Уведомления выключены',
        });
      } else if (data === 'set:unbind_group') {
        await store.bindGroupChat(ctx.pair.id, null);
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: 'Общий чат отвязан — анимации пойдут в личку обоим друзьям.',
        });
      } else if (data === 'set:reset') {
        await store.updateSettings({
          userId: profile.id,
          pairId: ctx.pair.id,
          roundStartedAt: new Date().toISOString(),
        });
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: '🔄 Начат новый раунд! Счётчики сброшены на 0.',
        });
        const freshCtx = await store.getPairContextForUser(profile.id);
        await sendMainMenu(transport, chatId, profile.id, freshCtx);
        return { ok: true, action: 'set:reset' };
      }

      const freshCtx = await store.getPairContextForUser(profile.id);
      if (cb.message?.message_id && freshCtx.pair) {
        const conn = freshCtx.botConnections.find((b) => b.user_id === profile.id);
        await transport.editMessageText({
          chatId,
          messageId: cb.message.message_id,
          text: formatSettingsMessage({
            pair: freshCtx.pair,
            notificationsEnabled: conn?.notification_enabled ?? true,
          }),
          replyMarkup: buildSettingsKeyboard({
            pair: freshCtx.pair,
            notificationsEnabled: conn?.notification_enabled ?? true,
          }),
        });
      }
      return { ok: true, action: data };
    }

    await transport.answerCallbackQuery({ callbackQueryId: cb.id });
    return { ok: true, action: 'callback:unknown' };
  }

  // -------------------------------------------------------------------------
  // 2. Handle Text Commands & Messages
  // -------------------------------------------------------------------------
  const msg = update.message;
  if (!msg?.from || !msg.text) {
    return { ok: true, action: 'ignored' };
  }

  const rawText = msg.text.trim();
  const commandToken = rawText.split(/\s+/)[0].split('@')[0].toLowerCase();
  const arg = rawText.slice(rawText.split(/\s+/)[0].length).trim();
  const chatId = String(msg.chat.id);
  const inGroup = isGroupChat(msg.chat);

  const profile = await store.upsertTelegramUser({
    telegramId: String(msg.from.id),
    privateChatId: inGroup ? undefined : chatId,
    displayName: formatDisplayName(msg.from),
    username: msg.from.username || null,
  });

  let ctx = await store.getPairContextForUser(profile.id);

  if (inGroup && ctx.pair && ctx.pair.group_chat_id !== chatId && (commandToken === '/start' || commandToken === '/bind')) {
    await store.bindGroupChat(ctx.pair.id, chatId);
    ctx = await store.getPairContextForUser(profile.id);
  }

  // /start [CODE]
  if (commandToken === '/start') {
    if (arg && !arg.startsWith('link_')) {
      return await handleJoinFlow(store, transport, profile.id, arg, chatId, inGroup ? chatId : null);
    }
    if (!ctx.pair) {
      await transport.sendMessage({
        chatId,
        text: [
          `👋 Привет, ${profile.display_name}! Добро пожаловать в «АЛЛО, РОУД!» — ASCII CHAOS.`,
          '',
          'Правила простые:',
          '1️⃣ Ты и твой друг связываете пару (только 2 игрока).',
          '2️⃣ Кто-то не поднял телефон — жмёшь «🥊 ОН НЕ ПОДНЯЛ ТЕЛЕФОН».',
          '3️⃣ В чат прилетает случайная текстовая ASCII-сцена хаоса и +1 шаг к титулу «ПРИДУРОК, КОТОРЫЙ НЕ ПОДНЯЛ ТЕЛЕФОН»!',
        ].join('\n'),
        replyMarkup: buildUnpairedKeyboard(),
      });
      return { ok: true, action: '/start:unpaired' };
    }
    if (ctx.pair.status !== 'active') {
      await sendNeedsPairMessage(transport, chatId, ctx.pair.invitation_code);
      return { ok: true, action: '/start:waiting' };
    }
    await sendMainMenu(transport, chatId, profile.id, ctx);
    return { ok: true, action: '/start:active' };
  }

  // /join <CODE> or bare invite code message (e.g. ALLO-7F3A)
  if (commandToken === '/join' || (!ctx.pair && /^ALLO-[A-Z0-9]{4,}$/i.test(rawText))) {
    const code = commandToken === '/join' ? arg : rawText;
    if (!code) {
      await transport.sendMessage({
        chatId,
        text: 'Укажи код приглашения после команды, например:\n/join ALLO-7F3A',
      });
      return { ok: true, action: '/join:missing_code' };
    }
    return await handleJoinFlow(store, transport, profile.id, code, chatId, inGroup ? chatId : null);
  }

  if (commandToken === '/bind') {
    if (!ctx.pair) {
      await sendNeedsPairMessage(transport, chatId);
      return { ok: true, action: '/bind:no_pair' };
    }
    if (!inGroup) {
      await transport.sendMessage({
        chatId,
        text: 'Добавь бота в ваш общий групповой чат с другом и отправь там /bind — тогда все ASCII-сцены будут выходить прямо в общую группу!',
      });
      return { ok: true, action: '/bind:not_group' };
    }
    await store.bindGroupChat(ctx.pair.id, chatId);
    await transport.sendMessage({
      chatId,
      text: '✅ Этот общий чат привязан к паре! Теперь ASCII-анимации и итоговые счета будут появляться здесь для обоих друзей.',
      replyMarkup: buildMainMenuKeyboard(),
    });
    return { ok: true, action: '/bind:ok' };
  }

  if (commandToken === '/unbindgroup') {
    if (ctx.pair) {
      await store.bindGroupChat(ctx.pair.id, null);
      await transport.sendMessage({
        chatId,
        text: '💬 Общий чат отвязан. Теперь анимации будут отправляться в личку обоим участникам.',
      });
    }
    return { ok: true, action: '/unbindgroup' };
  }

  if (!ctx.pair || ctx.pair.status !== 'active') {
    if (commandToken.startsWith('/')) {
      await sendNeedsPairMessage(transport, chatId, ctx.pair?.invitation_code);
    }
    return { ok: true, action: 'needs_pair' };
  }

  if (commandToken === '/menu') {
    await sendMainMenu(transport, chatId, profile.id, ctx);
    return { ok: true, action: '/menu' };
  }

  if (commandToken === '/miss') {
    return await handleMissAction({
      store,
      transport,
      actorId: profile.id,
      sourceChatId: chatId,
      idempotencyKey: `tg_upd_${update.update_id}`,
      frameDelayMs: deps.frameDelayMs,
      finalFrameHoldMs: deps.finalFrameHoldMs,
      sleep,
      randomFn,
    });
  }

  if (commandToken === '/score') {
    await sendScoreView(transport, chatId, profile.id, ctx);
    return { ok: true, action: '/score' };
  }

  if (commandToken === '/history') {
    await sendHistoryView(transport, chatId, ctx);
    return { ok: true, action: '/history' };
  }

  if (commandToken === '/settings') {
    await sendSettingsView(transport, chatId, profile.id, ctx);
    return { ok: true, action: '/settings' };
  }

  return { ok: true, action: 'unhandled_text' };
}

// ============================================================================
// ASCII Animation Player (sendMessage <pre> -> editMessageText frames -> delete)
// ============================================================================

async function playAsciiAnimationSequence(params: {
  transport: TelegramTransport;
  targetChatIds: string[];
  frames: string[];
  frameDelayMs: number;
  finalFrameHoldMs: number;
  sleep: (ms: number) => Promise<void>;
  onPrimaryMessageSent?: (chatId: string, messageId: number) => Promise<void>;
}): Promise<Array<{ chatId: string; messageId: number }>> {
  const {
    transport,
    targetChatIds,
    frames,
    frameDelayMs,
    finalFrameHoldMs,
    sleep,
    onPrimaryMessageSent,
  } = params;

  if (frames.length === 0 || targetChatIds.length === 0) {
    return [];
  }

  const activeMessages: Array<{ chatId: string; messageId: number }> = [];

  // Frame 0: initial sendMessage with HTML <pre>
  for (const targetChatId of targetChatIds) {
    const sent = await transport.sendMessage({
      chatId: targetChatId,
      text: wrapPreHtml(frames[0]),
      parseMode: 'HTML',
    });
    if (sent.ok && sent.result?.message_id) {
      activeMessages.push({ chatId: targetChatId, messageId: sent.result.message_id });
    }
  }

  if (activeMessages.length === 0) {
    return [];
  }

  if (onPrimaryMessageSent) {
    await onPrimaryMessageSent(activeMessages[0].chatId, activeMessages[0].messageId);
  }

  // Subsequent frames: sequential editMessageText on the exact same message_id
  let editable = activeMessages.slice();
  for (let i = 1; i < frames.length; i++) {
    if (frameDelayMs > 0) {
      await sleep(frameDelayMs);
    }

    const htmlFrame = wrapPreHtml(frames[i]);
    const stillEditable: Array<{ chatId: string; messageId: number }> = [];

    for (const target of editable) {
      let res = await transport.editMessageText({
        chatId: target.chatId,
        messageId: target.messageId,
        text: htmlFrame,
        parseMode: 'HTML',
      });

      // Handle Telegram rate limit (429 retry_after) cleanly if transport returned one
      if (!res.ok && res.errorCode === 429 && res.retryAfter) {
        const waitMs = Math.min(5000, Math.max(500, res.retryAfter * 1000));
        await sleep(waitMs);
        res = await transport.editMessageText({
          chatId: target.chatId,
          messageId: target.messageId,
          text: htmlFrame,
          parseMode: 'HTML',
        });
      }

      if (res.ok) {
        stillEditable.push(target);
      } else {
        const desc = (res.description || '').toLowerCase();
        // Ignore "message is not modified" — keep editing subsequent frames
        if (desc.includes('message is not modified')) {
          stillEditable.push(target);
        } else if (desc.includes('message to edit not found') || desc.includes('message was deleted')) {
          // Stop editing this missing message
        } else {
          // Keep trying remaining frames on transient errors
          stillEditable.push(target);
        }
      }
    }

    editable = stillEditable;
    if (editable.length === 0) break;
  }

  // Hold briefly on final F A T A L I T Y ! splash so both players read it
  if (finalFrameHoldMs > 0) {
    await sleep(finalFrameHoldMs);
  }

  // Cleanly delete temporary animation messages (swallow errors if Telegram forbids deletion)
  for (const temp of activeMessages) {
    try {
      await transport.deleteMessage(temp.chatId, temp.messageId);
    } catch {
      // Telegram may reject deleteMessage in some chat configurations; continue to show permanent result
    }
  }

  return activeMessages;
}

// ============================================================================
// Internal Flows
// ============================================================================

async function handleJoinFlow(
  store: BotStore,
  transport: TelegramTransport,
  userId: string,
  code: string,
  chatId: string,
  groupChatId: string | null
): Promise<{ ok: true; action: string }> {
  try {
    await store.joinPairByCode(userId, code, groupChatId);
  } catch (err) {
    await transport.sendMessage({
      chatId,
      text: `⚠️ ${err instanceof Error ? err.message : 'Не удалось присоединиться к паре.'}`,
    });
    return { ok: true, action: 'join:failed' };
  }

  const ctx = await store.getPairContextForUser(userId);
  const joiner = ctx.profiles.find((p) => p.id === userId);
  const creator = ctx.profiles.find((p) => p.id !== userId);

  if (ctx.pair) {
    const welcomeText = formatWelcomeActiveMessage({
      viewerName: joiner?.display_name || 'Игрок',
      partnerName: creator?.display_name || 'Друг',
      pair: ctx.pair,
      players: buildPlayersProgress(ctx),
      viewerId: userId,
    });
    await transport.sendMessage({
      chatId,
      text: `✅ Пара собрана! Вы оба на арене.\n\n${welcomeText}`,
      replyMarkup: buildMainMenuKeyboard(),
    });

    if (creator) {
      const creatorConn = ctx.botConnections.find((b) => b.user_id === creator.id);
      if (creatorConn && creatorConn.telegram_chat_id !== chatId) {
        await transport.sendMessage({
          chatId: creatorConn.telegram_chat_id,
          text: `🎉 ${joiner?.display_name || 'Твой друг'} присоединился к паре! Арена готова к бою.`,
          replyMarkup: buildMainMenuKeyboard(),
        });
      }
    }
  }

  return { ok: true, action: 'join:success' };
}

async function handleMissAction(params: {
  store: BotStore;
  transport: TelegramTransport;
  actorId: string;
  sourceChatId: string;
  callbackQueryId?: string;
  idempotencyKey: string;
  frameDelayMs?: number;
  finalFrameHoldMs?: number;
  sleep: (ms: number) => Promise<void>;
  randomFn: () => number;
}): Promise<{ ok: true; action: string }> {
  const {
    store,
    transport,
    actorId,
    sourceChatId,
    callbackQueryId,
    idempotencyKey,
    frameDelayMs,
    finalFrameHoldMs,
    sleep,
    randomFn,
  } = params;

  const ctx = await store.getPairContextForUser(actorId);
  const check = validateEventCreation({
    actorId,
    pair: ctx.pair,
    members: ctx.members,
    existingEvents: ctx.events,
    idempotencyKey,
    eventType: 'missed_call',
  });

  if (!check.ok) {
    if (callbackQueryId) {
      await transport.answerCallbackQuery({
        callbackQueryId,
        text: check.error,
        showAlert: true,
      });
    } else {
      await transport.sendMessage({ chatId: sourceChatId, text: `⏳ ${check.error}` });
    }
    return { ok: true, action: `miss:rejected:${check.code}` };
  }

  if (check.deduplicated) {
    if (callbackQueryId) {
      await transport.answerCallbackQuery({
        callbackQueryId,
        text: 'Событие уже обрабатывается!',
      });
    }
    return { ok: true, action: 'miss:deduplicated' };
  }

  const pair = ctx.pair!;
  const actor = ctx.profiles.find((p) => p.id === actorId)!;
  const recipient = ctx.profiles.find((p) => p.id === check.recipientId)!;
  const actorMember = ctx.members.find((m) => m.user_id === actorId);

  const recentScenes =
    Array.isArray(pair.recent_scenes) && pair.recent_scenes.length > 0
      ? pair.recent_scenes
      : pair.last_animation_file
        ? [pair.last_animation_file]
        : [];

  const scene: AsciiSceneDefinition = pickRandomAsciiScene(recentScenes, randomFn);

  if (callbackQueryId) {
    await transport.answerCallbackQuery({
      callbackQueryId,
      text: `🎬 Запускаю сцену: ${scene.title}`,
    });
  }

  const nowIso = new Date().toISOString();
  const createdEvent = await store.createMissedCallEvent({
    pair_id: pair.id,
    actor_id: actor.id,
    recipient_id: recipient.id,
    event_type: 'missed_call',
    status: 'pending',
    steps_awarded: 1,
    note: null,
    target_chat_id: pair.group_chat_id || sourceChatId,
    scene_id: scene.id,
    animation_file: scene.id,
    created_at: nowIso,
    resolved_at: null,
    idempotency_key: idempotencyKey,
  });

  await store.recordPlayedScene(pair.id, scene.id);

  const refreshedCtx = await store.getPairContextForUser(actorId);
  const players = buildPlayersProgress(refreshedCtx);
  const recipientProg = players.find((p) => p.userId === recipient.id);

  const actorConn = refreshedCtx.botConnections.find((b) => b.user_id === actor.id);
  const recipientConn = refreshedCtx.botConnections.find((b) => b.user_id === recipient.id);

  // Winner is ALWAYS the actor who pressed the button; direction matches lane_index
  const winnerSide: 'left' | 'right' = actorMember?.lane_index === 1 ? 'right' : 'left';
  const frames = renderAsciiSceneFrames(scene, {
    winnerSide,
    winnerName: actor.display_name,
    loserName: recipient.display_name,
  });

  const stepDelayMs = frameDelayMs ?? scene.frameDelayMs;
  const holdMs = finalFrameHoldMs ?? 1200;

  const groupChatId = pair.group_chat_id;
  const animationTargets: string[] = [];

  if (groupChatId) {
    if (sourceChatId !== groupChatId) {
      await transport.sendMessage({
        chatId: sourceChatId,
        text: `🎬 Запускаю сцену «${scene.title}» против ${recipient.display_name} в вашем общем чате!`,
      });
    }
    animationTargets.push(groupChatId);
  } else {
    const dmTargets = new Set<string>();
    dmTargets.add(actorConn?.telegram_chat_id || sourceChatId);
    if (recipientConn && recipientConn.notification_enabled) {
      dmTargets.add(recipientConn.telegram_chat_id);
    }
    animationTargets.push(...dmTargets);
  }

  const totalAnimMs = stepDelayMs * Math.max(0, frames.length - 1) + holdMs;
  const sentTempMessages = await playAsciiAnimationSequence({
    transport,
    targetChatIds: animationTargets,
    frames,
    frameDelayMs: stepDelayMs,
    finalFrameHoldMs: holdMs,
    sleep,
    onPrimaryMessageSent: async (primaryChatId, primaryMessageId) => {
      await store.updateEventLifecycle(createdEvent.id, {
        target_chat_id: primaryChatId,
        animation_message_id: String(primaryMessageId),
        animation_expires_at: new Date(Date.now() + totalAnimMs + 3000).toISOString(),
      });
    },
  });

  if (sentTempMessages.length > 0) {
    await store.updateEventLifecycle(createdEvent.id, {
      animation_deleted_at: new Date().toISOString(),
    });
  }

  // Stage 4: Permanent Shame Card + Reaction Buttons
  const permanentText = formatPermanentShameMessage({
    actorName: actor.display_name,
    recipientName: recipient.display_name,
    recipientConfirmedSteps: recipientProg?.confirmedSteps ?? 0,
    recipientPendingSteps: recipientProg?.pendingSteps ?? 1,
    finishThreshold: pair.finish_threshold,
    players,
    sceneTitle: scene.title,
  });
  const reactionKeyboard = buildEventReactionKeyboard(createdEvent.id);

  if (groupChatId) {
    const res = await transport.sendMessage({
      chatId: groupChatId,
      text: permanentText,
      replyMarkup: reactionKeyboard,
    });
    if (res.ok && res.result?.message_id) {
      await store.updateEventLifecycle(createdEvent.id, {
        result_message_id: String(res.result.message_id),
      });
    }
  } else {
    const recipientChatId = recipientConn?.telegram_chat_id;
    const actorChatId = actorConn?.telegram_chat_id || sourceChatId;

    if (recipientChatId) {
      const res = await transport.sendMessage({
        chatId: recipientChatId,
        text: permanentText,
        replyMarkup: reactionKeyboard,
      });
      if (res.ok && res.result?.message_id) {
        await store.updateEventLifecycle(createdEvent.id, {
          result_message_id: String(res.result.message_id),
        });
      }
    }

    if (actorChatId && actorChatId !== recipientChatId) {
      await transport.sendMessage({
        chatId: actorChatId,
        text: [
          `🎬 Сцена «${scene.title}» завершена! ${recipient.display_name} получил(а) карточку позора.`,
          '',
          `📊 Счёт: ${formatScoreboardLine(players, actor.id, pair.finish_threshold)}`,
          recipientChatId
            ? '⏳ Ждём ответа друга («Признаю» или «Оспорить»).'
            : '⚠️ Друг ещё не запускал бота в личке — отправь ему ссылку на бота!',
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(),
      });
    }
  }

  return { ok: true, action: 'miss:ascii_completed' };
}

async function handleEventCallbackAction(params: {
  store: BotStore;
  transport: TelegramTransport;
  cb: TelegramCallbackQuery;
  userId: string;
  action: 'confirm' | 'dispute' | 'cancel';
  eventId: string;
  fallbackChatId: string;
  frameDelayMs?: number;
  finalFrameHoldMs?: number;
  sleep: (ms: number) => Promise<void>;
}): Promise<{ ok: true; action: string }> {
  const {
    store,
    transport,
    cb,
    userId,
    action,
    eventId,
    fallbackChatId,
    frameDelayMs,
    finalFrameHoldMs,
    sleep,
  } = params;

  const event = await store.getEventById(eventId);
  if (!event) {
    await transport.answerCallbackQuery({
      callbackQueryId: cb.id,
      text: 'Событие не найдено.',
      showAlert: true,
    });
    return { ok: true, action: 'event:not_found' };
  }

  const ctx = await store.getPairContextForUser(userId);
  const check = validateEventTransition({
    event,
    userId,
    action,
    members: ctx.members,
  });

  if (!check.ok) {
    await transport.answerCallbackQuery({
      callbackQueryId: cb.id,
      text: check.error,
      showAlert: true,
    });
    return { ok: true, action: `event:rejected:${check.code}` };
  }

  const resolvedAt = new Date().toISOString();
  await store.updateEventLifecycle(event.id, {
    status: check.nextStatus,
    resolved_at: resolvedAt,
  });

  const refreshedCtx = await store.getPairContextForUser(userId);
  const pair = refreshedCtx.pair!;
  const players = buildPlayersProgress(refreshedCtx);
  const actor = refreshedCtx.profiles.find((p) => p.id === event.actor_id)!;
  const recipient = refreshedCtx.profiles.find((p) => p.id === event.recipient_id)!;
  const recipientProg = players.find((p) => p.userId === recipient.id)!;

  const toastText =
    action === 'confirm'
      ? `😂 Пропуск признан! Счёт: ${recipientProg.confirmedSteps}/${pair.finish_threshold}`
      : action === 'dispute'
        ? '🤨 Событие отправлено в споры!'
        : '🕊️ Обвинение снято.';

  await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: toastText });

  const chatId = cb.message ? String(cb.message.chat.id) : fallbackChatId;
  const msgId = cb.message?.message_id;

  const scoreLines = players
    .map((p) => `• ${p.profile.display_name} — ${p.confirmedSteps}/${pair.finish_threshold}`)
    .join('\n');

  if (msgId) {
    if (action === 'confirm') {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        text: [
          `✅ ПРОПУСК ПРИЗНАН — ${recipient.display_name} (+1 шаг)`,
          `🏅 Звание: «${recipientProg.currentRank.title}»`,
          '',
          '📊 Актуальный счёт:',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(),
      });
    } else if (action === 'dispute') {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        text: [
          `🤨 СПОРНОЕ СОБЫТИЕ — ${recipient.display_name} не согласен(на)!`,
          'Счёт не увеличен, пока спор не будет решён.',
          '',
          '📊 Текущий счёт:',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildDisputedEventKeyboard(event.id),
      });
    } else {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        text: [
          `🕊️ СОБЫТИЕ ОТМЕНЕНО — ${actor.display_name} снял(а) обвинение.`,
          '',
          '📊 Текущий счёт:',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(),
      });
    }
  }

  if (!pair.group_chat_id) {
    const partner = action === 'cancel' ? recipient : actor;
    const partnerConn = refreshedCtx.botConnections.find(
      (b) => b.user_id === partner.id && b.notification_enabled
    );
    if (partnerConn && partnerConn.telegram_chat_id !== chatId) {
      const dmStatus =
        action === 'confirm'
          ? `✅ ${recipient.display_name} признал(а) пропуск! Счёт: ${recipientProg.confirmedSteps}/${pair.finish_threshold}`
          : action === 'dispute'
            ? `🤨 ${recipient.display_name} оспаривает пропуск! Шаг заморожен.`
            : `🕊️ ${actor.display_name} отменил(а) отметку о пропуске.`;
      await transport.sendMessage({
        chatId: partnerConn.telegram_chat_id,
        text: `${dmStatus}\n\n${scoreLines}`,
        replyMarkup: action === 'dispute' ? buildDisputedEventKeyboard(event.id) : buildMainMenuKeyboard(),
      });
    }
  }

  // Check GAME OVER (10/10 or custom finish_threshold)
  if (action === 'confirm' && recipientProg.hasReachedFinish) {
    const targetChats = new Set<string>();
    if (pair.group_chat_id) {
      targetChats.add(pair.group_chat_id);
    } else {
      for (const conn of refreshedCtx.botConnections) {
        if (conn.notification_enabled) targetChats.add(conn.telegram_chat_id);
      }
      if (targetChats.size === 0) targetChats.add(chatId);
    }

    const gameOverFrames = renderAsciiSceneFrames(ASCII_GAMEOVER_SCENE, {
      winnerSide: 'left',
      winnerName: actor.display_name,
      loserName: recipient.display_name,
    });

    await playAsciiAnimationSequence({
      transport,
      targetChatIds: Array.from(targetChats),
      frames: gameOverFrames,
      frameDelayMs: frameDelayMs ?? ASCII_GAMEOVER_SCENE.frameDelayMs,
      finalFrameHoldMs: finalFrameHoldMs ?? 1200,
      sleep,
    });

    const gameOverText = formatGameOverMessage({
      loserName: recipient.display_name,
      finishThreshold: pair.finish_threshold,
      players,
    });
    for (const tc of targetChats) {
      await transport.sendMessage({
        chatId: tc,
        text: gameOverText,
        replyMarkup: buildGameOverKeyboard(),
      });
    }
  }

  return { ok: true, action: `event:${action}` };
}

export async function cleanupExpiredAnimations(
  deps: { store?: BotStore; transport?: TelegramTransport } = {}
): Promise<{ checked: number; deleted: number }> {
  const store = deps.store || getDefaultBotStore();
  const transport = deps.transport || defaultTransport;
  const expired = await store.findExpiredPendingAnimations();
  let deleted = 0;

  for (const ev of expired) {
    if (ev.target_chat_id && ev.animation_message_id) {
      try {
        await transport.deleteMessage(ev.target_chat_id, ev.animation_message_id);
        deleted++;
      } catch {
        // mark processed anyway so cron does not retry forever
      }
      await store.updateEventLifecycle(ev.id, {
        animation_deleted_at: new Date().toISOString(),
      });
    }
  }

  return { checked: expired.length, deleted };
}

async function sendNeedsPairMessage(
  transport: TelegramTransport,
  chatId: string,
  waitingCode?: string
): Promise<void> {
  if (waitingCode) {
    await transport.sendMessage({
      chatId,
      text: [
        '⏳ Твоя пара ещё ждёт второго участника!',
        '',
        `🔑 Код приглашения: ${waitingCode}`,
        `Отправь другу этот код — он должен написать боту: /join ${waitingCode}`,
      ].join('\n'),
    });
    return;
  }

  await transport.sendMessage({
    chatId,
    text: '🎮 Сначала создай пару или присоединись по коду приглашения от друга:',
    replyMarkup: buildUnpairedKeyboard(),
  });
}

async function sendMainMenu(
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext
): Promise<void> {
  const me = ctx.profiles.find((p) => p.id === viewerId);
  const partner = ctx.profiles.find((p) => p.id !== viewerId);
  const players = buildPlayersProgress(ctx);

  await transport.sendMessage({
    chatId,
    text: formatWelcomeActiveMessage({
      viewerName: me?.display_name || 'Ты',
      partnerName: partner?.display_name || 'Друг',
      pair: ctx.pair!,
      players,
      viewerId,
    }),
    replyMarkup: buildMainMenuKeyboard(),
  });
}

async function sendScoreView(
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext
): Promise<void> {
  await transport.sendMessage({
    chatId,
    text: formatScoreMessage({
      viewerId,
      pair: ctx.pair!,
      players: buildPlayersProgress(ctx),
    }),
    replyMarkup: buildMainMenuKeyboard(),
  });
}

async function sendHistoryView(
  transport: TelegramTransport,
  chatId: string,
  ctx: PairContext
): Promise<void> {
  await transport.sendMessage({
    chatId,
    text: formatHistoryMessage({
      events: ctx.events,
      profiles: ctx.profiles,
    }),
    replyMarkup: buildMainMenuKeyboard(),
  });
}

async function sendSettingsView(
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext
): Promise<void> {
  const conn = ctx.botConnections.find((b) => b.user_id === viewerId);
  const enabled = conn?.notification_enabled ?? true;
  await transport.sendMessage({
    chatId,
    text: formatSettingsMessage({
      pair: ctx.pair!,
      notificationsEnabled: enabled,
    }),
    replyMarkup: buildSettingsKeyboard({
      pair: ctx.pair!,
      notificationsEnabled: enabled,
    }),
  });
}
