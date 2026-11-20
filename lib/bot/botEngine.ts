import {
  computePlayerProgress,
  validateEventCreation,
  validateEventTransition,
} from '../../src/game/rules.js';
import type { PlayerProgress } from '../../src/types/game.js';
import {
  ASCII_GAMEOVER_SCENE,
  getAsciiSceneById,
  pickRandomAsciiScene,
  renderAsciiSceneFrames,
  SCENE_TYPE_LABELS,
  type AsciiSceneDefinition,
} from './asciiScenes.js';
import { escapeHtml, wrapPreHtml } from './asciiUtils.js';
import { getDefaultBotStore, type BotStore, type PairContext } from './botStore.js';
import { looksLikeInviteCode } from './inviteCode.js';
import {
  buildBackToMenuKeyboard,
  buildDisputedEventKeyboard,
  buildEventReactionKeyboard,
  buildGameOverKeyboard,
  buildMainMenuKeyboard,
  buildPairSettingsUrl,
  buildPendingEnvelopeKeyboard,
  buildSettingsKeyboard,
  buildUnpairedKeyboard,
  formatGameOverMessage,
  formatHistoryMessage,
  formatPermanentShameMessage,
  formatScoreboardLine,
  formatScoreMessage,
  formatSettingsMessage,
  formatStatsMessage,
  formatUnopenedSceneEnvelopeMessage,
  formatWelcomeActiveMessage,
  type InlineKeyboardMarkup,
} from './messages.js';
import { computeGameStats } from './stats.js';
import {
  tgAnswerCallbackQuery,
  tgDeleteMessage,
  tgEditMessageText,
  tgSendMessage,
  type TelegramApiResponse,
  type TelegramSentMessage,
} from './telegramApi.js';

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
  frameDelayMs?: number;
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

type UpdateResult = { ok: true; deduplicated?: boolean; action?: string };

export async function processTelegramUpdate(
  update: TelegramUpdate,
  deps: BotEngineDeps = {}
): Promise<UpdateResult> {
  const store = deps.store || getDefaultBotStore();
  const hasId = typeof update.update_id === 'number';

  if (hasId) {
    const claimed = await store.claimWebhookUpdate(update.update_id);
    if (!claimed) {
      return { ok: true, deduplicated: true };
    }
  }

  try {
    return await processClaimedUpdate(update, deps, store);
  } catch (err) {
    if (hasId && store.releaseWebhookUpdate) {
      try {
        await store.releaseWebhookUpdate(update.update_id);
      } catch {
        // ignore
      }
    }
    throw err;
  }
}

async function bestEffortDeleteMessage(
  transport: TelegramTransport,
  chatId: string,
  messageId?: number | null
): Promise<void> {
  if (!messageId) return;
  try {
    await transport.deleteMessage(chatId, messageId);
  } catch {
    // Telegram may deny deletion in some chats — silently ignore
  }
}

async function editOrSendPanel(params: {
  store?: BotStore;
  transport: TelegramTransport;
  chatId: string;
  messageId?: number;
  text: string;
  replyMarkup?: InlineKeyboardMarkup;
  rememberPanel?: boolean;
}) {
  const { store, transport, chatId, messageId, text, replyMarkup, rememberPanel = true } = params;
  if (messageId) {
    const edited = await transport.editMessageText({
      chatId,
      messageId,
      text,
      parseMode: 'HTML',
      replyMarkup,
    });
    if (edited.ok || (edited.description || '').toLowerCase().includes('message is not modified')) {
      if (store && rememberPanel) {
        await store.setChatPanelMessageId(chatId, messageId);
      }
      return edited;
    }
  }

  const prevPanelId = store && rememberPanel ? await store.getChatPanelMessageId(chatId) : null;
  const sent = await transport.sendMessage({
    chatId,
    text,
    parseMode: 'HTML',
    replyMarkup,
  });

  if (store && rememberPanel && sent.ok && sent.result?.message_id) {
    const nextId = sent.result.message_id;
    await store.setChatPanelMessageId(chatId, nextId);
    if (prevPanelId && prevPanelId !== nextId) {
      await bestEffortDeleteMessage(transport, chatId, prevPanelId);
    }
  }

  return sent;
}

async function processClaimedUpdate(
  update: TelegramUpdate,
  deps: BotEngineDeps,
  store: BotStore
): Promise<UpdateResult> {
  const transport = deps.transport || defaultTransport;
  const sleep = deps.sleep || defaultSleep;
  const randomFn = deps.randomFn || Math.random;

  // -------------------------------------------------------------------------
  // 1. Inline Keyboard Callbacks
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
          text: `У вас уже есть пара (${ctx.pair.invitation_code})`,
        });
        return { ok: true, action: 'pair:already_exists' };
      }
      const pair = await store.createPair(profile.id, chat && isGroupChat(chat) ? chatId : null);
      await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: 'Пара создана' });
      await editOrSendPanel({
        store,
        transport,
        chatId,
        messageId: cb.message?.message_id,
        text: [
          '<b>ПАРА СОЗДАНА</b>',
          '',
          `Код приглашения: <code>${escapeHtml(pair.invitation_code)}</code>`,
          '',
          'Отправьте код другу — он должен ввести:',
          `<code>/join ${escapeHtml(pair.invitation_code)}</code>`,
        ].join('\n'),
        replyMarkup: {
          inline_keyboard: [
            [{ text: 'Ввести код', callback_data: 'pair:join_prompt' }],
            [{ text: 'Отменить код', callback_data: 'pair:leave_confirm' }],
          ],
        },
      });
      return { ok: true, action: 'pair:create' };
    }

    if (data === 'pair:leave_prompt') {
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      const ctx = await store.getPairContextForUser(profile.id);
      if (!ctx.pair) {
        await sendNeedsPairMessage(store, transport, chatId, undefined, cb.message?.message_id);
        return { ok: true, action: 'pair:leave_prompt:no_pair' };
      }
      await editOrSendPanel({
        store,
        transport,
        chatId,
        messageId: cb.message?.message_id,
        text: [
          '<b>ВЫЙТИ ИЗ ПАРЫ?</b>',
          '',
          ctx.pair.status === 'active'
            ? 'Текущий раунд и связка завершатся для обоих друзей. После выхода можно сразу создать новую пару или ввести другой код.'
            : `Код приглашения <code>${escapeHtml(ctx.pair.invitation_code)}</code> будет отменён.`,
        ].join('\n'),
        replyMarkup: {
          inline_keyboard: [
            [
              { text: 'Да, выйти', callback_data: 'pair:leave_confirm' },
              { text: 'Отмена', callback_data: 'act:name_cancel' },
            ],
          ],
        },
      });
      return { ok: true, action: 'pair:leave_prompt' };
    }

    if (data === 'pair:leave_confirm') {
      const ctx = await store.getPairContextForUser(profile.id);
      const res = await store.leavePair(profile.id);
      await store.setPendingUserInput(profile.id, null);
      await transport.answerCallbackQuery({
        callbackQueryId: cb.id,
        text: res.left ? 'Вы вышли из пары' : 'Пара не найдена',
      });

      await editOrSendPanel({
        store,
        transport,
        chatId,
        messageId: cb.message?.message_id,
        text: [
          '<b>Вы вышли из пары.</b>',
          '',
          'Теперь можно создать новую пару или ввести код от друга.',
        ].join('\n'),
        replyMarkup: buildUnpairedKeyboard(),
      });

      if (res.left && ctx.pair) {
        for (const partnerId of res.partnerUserIds) {
          const partnerConn = ctx.botConnections.find((b) => b.user_id === partnerId);
          if (partnerConn?.telegram_chat_id && partnerConn.telegram_chat_id !== chatId) {
            await editOrSendPanel({
              store,
              transport,
              chatId: partnerConn.telegram_chat_id,
              text: [
                `<b>${escapeHtml(profile.display_name)}</b> вышел(а) из пары.`,
                '',
                'Связка завершена — можно создать новую пару или ввести код от друга.',
              ].join('\n'),
              replyMarkup: buildUnpairedKeyboard(),
            });
          }
        }
        if (ctx.pair.group_chat_id && ctx.pair.group_chat_id !== chatId) {
          await editOrSendPanel({
            store,
            transport,
            chatId: ctx.pair.group_chat_id,
            text: [
              `<b>${escapeHtml(profile.display_name)}</b> вышел(а) из пары.`,
              '',
              'Связка завершена — создайте новую пару или введите код.',
            ].join('\n'),
            replyMarkup: buildUnpairedKeyboard(),
          });
        }
      }

      return { ok: true, action: 'pair:leave_confirm' };
    }

    if (data === 'pair:join_prompt') {
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      await editOrSendPanel({
        store,
        transport,
        chatId,
        messageId: cb.message?.message_id,
        text: [
          '<b>ВХОД В ПАРУ</b>',
          '',
          'Отправьте код приглашения сообщением:',
          '<code>ALLO-7F3A</code>',
        ].join('\n'),
        replyMarkup: {
          inline_keyboard: [[{ text: 'Назад', callback_data: 'act:name_cancel' }]],
        },
      });
      return { ok: true, action: 'pair:join_prompt' };
    }

    if (data === 'act:name_prompt') {
      await store.setPendingUserInput(profile.id, 'name');
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      await editOrSendPanel({
        store,
        transport,
        chatId,
        messageId: cb.message?.message_id,
        text: [
          '<b>ИМЯ В ИГРЕ</b>',
          `Сейчас: <b>${escapeHtml(profile.display_name)}</b>`,
          '',
          'Отправьте новое имя следующим сообщением (до 24 символов).',
          'Это сообщение автоматически заменит старое.',
        ].join('\n'),
        replyMarkup: {
          inline_keyboard: [[{ text: 'Отмена', callback_data: 'act:name_cancel' }]],
        },
      });
      return { ok: true, action: 'act:name_prompt' };
    }

    if (data === 'act:name_cancel') {
      await store.setPendingUserInput(profile.id, null);
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      const ctx = await store.getPairContextForUser(profile.id);
      if (ctx.pair && ctx.pair.status === 'active') {
        await sendMainMenu(store, transport, chatId, profile.id, ctx, cb.message?.message_id);
      } else {
        await sendNeedsPairMessage(store, transport, chatId, ctx.pair?.invitation_code, cb.message?.message_id);
      }
      return { ok: true, action: 'act:name_cancel' };
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

    if (data === 'act:callback') {
      return await handleCallbackLogAction({
        store,
        transport,
        actorId: profile.id,
        sourceChatId: chatId,
        callbackQueryId: cb.id,
        messageId: cb.message?.message_id,
        idempotencyKey: `tg_upd_${update.update_id}`,
      });
    }

    if (data === 'act:preview') {
      return await handleScenePreviewAction({
        store,
        transport,
        actorId: profile.id,
        sourceChatId: chatId,
        callbackQueryId: cb.id,
        frameDelayMs: deps.frameDelayMs,
        finalFrameHoldMs: deps.finalFrameHoldMs,
        sleep,
        randomFn,
      });
    }

    if (
      data === 'act:menu' ||
      data === 'act:score' ||
      data === 'act:history' ||
      data === 'act:stats' ||
      data === 'act:settings'
    ) {
      await transport.answerCallbackQuery({ callbackQueryId: cb.id });
      const ctx = await store.getPairContextForUser(profile.id);
      if (!ctx.pair || ctx.pair.status !== 'active') {
        await sendNeedsPairMessage(store, transport, chatId, ctx.pair?.invitation_code, cb.message?.message_id);
        return { ok: true, action: data };
      }
      const msgId = cb.message?.message_id;
      if (data === 'act:menu') {
        await sendMainMenu(store, transport, chatId, profile.id, ctx, msgId);
      } else if (data === 'act:score') {
        await sendScoreView(store, transport, chatId, profile.id, ctx, msgId);
      } else if (data === 'act:history') {
        await sendHistoryView(store, transport, chatId, profile.id, ctx, msgId);
      } else if (data === 'act:stats') {
        await sendStatsView(store, transport, chatId, profile.id, ctx, msgId);
      } else if (data === 'act:settings') {
        await sendSettingsView(store, transport, chatId, profile.id, ctx, msgId);
      }
      return { ok: true, action: data };
    }

    if (data.startsWith('replay:')) {
      const eventId = data.slice('replay:'.length).trim();
      if (eventId) {
        return await handleReplaySceneAction({
          store,
          transport,
          cb,
          userId: profile.id,
          eventId,
          fallbackChatId: chatId,
          frameDelayMs: deps.frameDelayMs,
          finalFrameHoldMs: deps.finalFrameHoldMs,
          sleep,
          randomFn,
        });
      }
    }

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

    if (data.startsWith('set:')) {
      const ctx = await store.getPairContextForUser(profile.id);
      if (!ctx.pair) {
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: 'Сначала создайте или примите приглашение в пару.',
          showAlert: true,
        });
        return { ok: true, action: 'set:no_pair' };
      }

      if (data.startsWith('set:threshold:')) {
        const val = Number(data.split(':')[2]);
        await store.updateSettings({ userId: profile.id, pairId: ctx.pair.id, finishThreshold: val });
        await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: `Лимит: ${val}` });
      } else if (data.startsWith('set:cooldown:')) {
        const val = Number(data.split(':')[2]);
        await store.updateSettings({ userId: profile.id, pairId: ctx.pair.id, cooldownSeconds: val });
        await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: `Пауза: ${val} сек.` });
      } else if (data === 'set:anim:toggle') {
        const nextFast = !Boolean(ctx.pair.fast_animation);
        await store.updateSettings({ userId: profile.id, pairId: ctx.pair.id, fastAnimation: nextFast });
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: nextFast ? 'Быстрая анимация (5 кадров)' : 'Полная анимация (8 кадров)',
        });
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
          text: 'Общий чат отвязан',
        });
      } else if (data === 'set:reset') {
        await store.updateSettings({
          userId: profile.id,
          pairId: ctx.pair.id,
          roundStartedAt: new Date().toISOString(),
        });
        await transport.answerCallbackQuery({
          callbackQueryId: cb.id,
          text: 'Новый раунд начат',
        });
        const freshCtx = await store.getPairContextForUser(profile.id);
        await sendMainMenu(store, transport, chatId, profile.id, freshCtx, cb.message?.message_id);
        return { ok: true, action: 'set:reset' };
      }

      const freshCtx = await store.getPairContextForUser(profile.id);
      if (cb.message?.message_id && freshCtx.pair) {
        const conn = freshCtx.botConnections.find((b) => b.user_id === profile.id);
        await transport.editMessageText({
          chatId,
          messageId: cb.message.message_id,
          parseMode: 'HTML',
          text: formatSettingsMessage({
            pair: freshCtx.pair,
            notificationsEnabled: conn?.notification_enabled ?? true,
          }),
          replyMarkup: buildSettingsKeyboard({
            pair: freshCtx.pair,
            notificationsEnabled: conn?.notification_enabled ?? true,
            settingsUrl: buildPairSettingsUrl(freshCtx.pair, profile.id),
          }),
        });
      }
      return { ok: true, action: data };
    }

    await transport.answerCallbackQuery({ callbackQueryId: cb.id });
    return { ok: true, action: 'callback:unknown' };
  }

  // -------------------------------------------------------------------------
  // 2. Text Commands & Messages
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

  // Best-effort cleanup of incoming slash commands so chat stays spotless
  if (commandToken.startsWith('/')) {
    await bestEffortDeleteMessage(transport, chatId, msg.message_id);
  }

  // Handle interactive /name response when waiting for user text input
  if (!commandToken.startsWith('/')) {
    const pendingMode = await store.getPendingUserInput(profile.id);
    if (pendingMode === 'name') {
      const cleanName = rawText.replace(/\s+/g, ' ').trim().slice(0, 24);
      await store.setPendingUserInput(profile.id, null);
      await bestEffortDeleteMessage(transport, chatId, msg.message_id);
      if (cleanName.length > 0) {
        await store.updateUserProfile({ userId: profile.id, displayName: cleanName });
        ctx = await store.getPairContextForUser(profile.id);
      }
      if (ctx.pair && ctx.pair.status === 'active') {
        await sendMainMenu(store, transport, chatId, profile.id, ctx);
      } else {
        await sendNeedsPairMessage(store, transport, chatId, ctx.pair?.invitation_code);
      }
      return { ok: true, action: 'name:updated' };
    }
  }

  if (commandToken === '/name') {
    if (arg) {
      const cleanName = arg.replace(/\s+/g, ' ').trim().slice(0, 24);
      await store.setPendingUserInput(profile.id, null);
      if (cleanName.length > 0) {
        await store.updateUserProfile({ userId: profile.id, displayName: cleanName });
        ctx = await store.getPairContextForUser(profile.id);
      }
      if (ctx.pair && ctx.pair.status === 'active') {
        await sendMainMenu(store, transport, chatId, profile.id, ctx);
      } else {
        await sendNeedsPairMessage(store, transport, chatId, ctx.pair?.invitation_code);
      }
      return { ok: true, action: '/name:updated' };
    }

    await store.setPendingUserInput(profile.id, 'name');
    await editOrSendPanel({
      store,
      transport,
      chatId,
      text: [
        '<b>ИМЯ В ИГРЕ</b>',
        `Сейчас: <b>${escapeHtml(profile.display_name)}</b>`,
        '',
        'Отправьте новое имя следующим сообщением (до 24 символов).',
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [[{ text: 'Отмена', callback_data: 'act:name_cancel' }]],
      },
    });
    return { ok: true, action: '/name:prompt' };
  }

  if (
    inGroup &&
    ctx.pair &&
    ctx.pair.group_chat_id !== chatId &&
    (commandToken === '/start' || commandToken === '/bind')
  ) {
    await store.bindGroupChat(ctx.pair.id, chatId);
    ctx = await store.getPairContextForUser(profile.id);
  }

  if (commandToken === '/start') {
    if (arg && !arg.startsWith('link_')) {
      return await handleJoinFlow(store, transport, profile.id, arg, chatId, inGroup ? chatId : null);
    }
    if (!ctx.pair) {
      await editOrSendPanel({
        store,
        transport,
        chatId,
        text: [
          `<b>АЛЛО, ПИДР</b>`,
          `<i>Игрок: ${escapeHtml(profile.display_name)}</i>`,
          '',
          'Минималистичная дуэль для двух друзей:',
          '1. Свяжите пару по коду приглашения',
          '2. Фиксируйте пропуски — в чат прилетает короткая анимация',
          '3. Имя и пиксельных персонажей настройте здесь или на сайте',
        ].join('\n'),
        replyMarkup: buildUnpairedKeyboard(),
      });
      return { ok: true, action: '/start:unpaired' };
    }
    if (ctx.pair.status !== 'active') {
      await sendNeedsPairMessage(store, transport, chatId, ctx.pair.invitation_code);
      return { ok: true, action: '/start:waiting' };
    }
    await sendMainMenu(store, transport, chatId, profile.id, ctx);
    return { ok: true, action: '/start:active' };
  }

  if (
    commandToken === '/join' ||
    ((!ctx.pair || ctx.pair.status === 'waiting') && looksLikeInviteCode(rawText))
  ) {
    const code = commandToken === '/join' ? arg : rawText;
    if (!code) {
      await editOrSendPanel({
        store,
        transport,
        chatId,
        text: 'Укажите код после команды: <code>/join ALLO-7F3A</code>',
      });
      return { ok: true, action: '/join:missing_code' };
    }
    return await handleJoinFlow(store, transport, profile.id, code, chatId, inGroup ? chatId : null);
  }

  if (commandToken === '/bind') {
    if (!ctx.pair) {
      await sendNeedsPairMessage(store, transport, chatId);
      return { ok: true, action: '/bind:no_pair' };
    }
    if (!inGroup) {
      await editOrSendPanel({
        store,
        transport,
        chatId,
        text: 'Добавьте бота в общий чат с другом и отправьте там <code>/bind</code>.',
      });
      return { ok: true, action: '/bind:not_group' };
    }
    await store.bindGroupChat(ctx.pair.id, chatId);
    await editOrSendPanel({
      store,
      transport,
      chatId,
      text: '<b>Общий чат привязан.</b>\nСцены и счёт раунда теперь выходят здесь.',
      replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, profile.id)),
    });
    return { ok: true, action: '/bind:ok' };
  }

  if (commandToken === '/unbindgroup') {
    if (ctx.pair) {
      await store.bindGroupChat(ctx.pair.id, null);
      await editOrSendPanel({
        store,
        transport,
        chatId,
        text: 'Общий чат отвязан. Уведомления переведены в личные сообщения.',
      });
    }
    return { ok: true, action: '/unbindgroup' };
  }

  if (commandToken === '/leave') {
    if (!ctx.pair) {
      await sendNeedsPairMessage(store, transport, chatId);
      return { ok: true, action: '/leave:no_pair' };
    }
    await editOrSendPanel({
      store,
      transport,
      chatId,
      text: [
        '<b>ВЫЙТИ ИЗ ПАРЫ?</b>',
        '',
        ctx.pair.status === 'active'
          ? 'Текущий раунд и связка завершатся для обоих друзей. После выхода можно сразу создать новую пару или ввести другой код.'
          : `Код приглашения <code>${escapeHtml(ctx.pair.invitation_code)}</code> будет отменён.`,
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [
          [
            { text: 'Да, выйти', callback_data: 'pair:leave_confirm' },
            { text: 'Отмена', callback_data: 'act:name_cancel' },
          ],
        ],
      },
    });
    return { ok: true, action: '/leave:prompt' };
  }

  if (!ctx.pair || ctx.pair.status !== 'active') {
    if (commandToken.startsWith('/')) {
      await sendNeedsPairMessage(store, transport, chatId, ctx.pair?.invitation_code);
    }
    return { ok: true, action: 'needs_pair' };
  }

  if (commandToken === '/menu') {
    await sendMainMenu(store, transport, chatId, profile.id, ctx);
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

  if (commandToken === '/callback') {
    return await handleCallbackLogAction({
      store,
      transport,
      actorId: profile.id,
      sourceChatId: chatId,
      idempotencyKey: `tg_upd_${update.update_id}`,
    });
  }

  if (commandToken === '/scenes') {
    return await handleScenePreviewAction({
      store,
      transport,
      actorId: profile.id,
      sourceChatId: chatId,
      frameDelayMs: deps.frameDelayMs,
      finalFrameHoldMs: deps.finalFrameHoldMs,
      sleep,
      randomFn,
    });
  }

  if (commandToken === '/score') {
    await sendScoreView(store, transport, chatId, profile.id, ctx);
    return { ok: true, action: '/score' };
  }

  if (commandToken === '/stats') {
    await sendStatsView(store, transport, chatId, profile.id, ctx);
    return { ok: true, action: '/stats' };
  }

  if (commandToken === '/history') {
    await sendHistoryView(store, transport, chatId, profile.id, ctx);
    return { ok: true, action: '/history' };
  }

  if (commandToken === '/settings') {
    await sendSettingsView(store, transport, chatId, profile.id, ctx);
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
        if (desc.includes('message is not modified')) {
          stillEditable.push(target);
        } else if (desc.includes('message to edit not found') || desc.includes('message was deleted')) {
          // Stop editing missing message
        } else {
          stillEditable.push(target);
        }
      }
    }

    editable = stillEditable;
    if (editable.length === 0) break;
  }

  if (finalFrameHoldMs > 0) {
    await sleep(finalFrameHoldMs);
  }

  for (const temp of activeMessages) {
    try {
      await transport.deleteMessage(temp.chatId, temp.messageId);
    } catch {
      // ignore if Telegram denies deleteMessage
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
      parseMode: 'HTML',
      text: escapeHtml(err instanceof Error ? err.message : 'Не удалось присоединиться к паре.'),
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
    await editOrSendPanel({
      store,
      transport,
      chatId,
      text: `<b>Пара собрана.</b>\n\n${welcomeText}`,
      replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, userId)),
    });

    if (creator) {
      const creatorConn = ctx.botConnections.find((b) => b.user_id === creator.id);
      if (creatorConn && creatorConn.telegram_chat_id !== chatId) {
        await editOrSendPanel({
          store,
          transport,
          chatId: creatorConn.telegram_chat_id,
          text: `<b>${escapeHtml(joiner?.display_name || 'Друг')}</b> в игре. Можно начинать.`,
          replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, creator.id)),
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
      await transport.sendMessage({ chatId: sourceChatId, text: check.error });
    }
    return { ok: true, action: `miss:rejected:${check.code}` };
  }

  if (check.deduplicated) {
    if (callbackQueryId) {
      await transport.answerCallbackQuery({
        callbackQueryId,
        text: 'Событие уже обрабатывается.',
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
      text: `Сцена: ${scene.title}`,
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

  const winnerSide: 'left' | 'right' = actorMember?.lane_index === 1 ? 'right' : 'left';
  const frames = renderAsciiSceneFrames(scene, {
    winnerSide,
    winnerName: actor.display_name,
    loserName: recipient.display_name,
    fastMode: Boolean(pair.fast_animation),
  });

  const stepDelayMs = frameDelayMs ?? scene.frameDelayMs;
  const holdMs = finalFrameHoldMs ?? 1200;

  const groupChatId = pair.group_chat_id;
  const animationTargets: string[] = [];

  if (groupChatId) {
    if (sourceChatId !== groupChatId) {
      await transport.sendMessage({
        chatId: sourceChatId,
        parseMode: 'HTML',
        text: `Сцена «${escapeHtml(scene.title)}» отправлена в общий чат.`,
      });
    }
    animationTargets.push(groupChatId);
  } else {
    // In DM mode, play immediately only for the caller (who is watching right now).
    // The friend receives a play-on-demand envelope ("Открыть сцену") so they don't miss the animation.
    animationTargets.push(actorConn?.telegram_chat_id || sourceChatId);
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
      parseMode: 'HTML',
      text: permanentText,
      replyMarkup: reactionKeyboard,
    });
    if (res.ok && res.result?.message_id) {
      await store.updateEventLifecycle(createdEvent.id, {
        result_message_id: String(res.result.message_id),
      });
    }
  } else {
    const recipientChatId =
      recipientConn && recipientConn.notification_enabled ? recipientConn.telegram_chat_id : undefined;
    const actorChatId = actorConn?.telegram_chat_id || sourceChatId;

    if (recipientChatId) {
      const envelopeText = formatUnopenedSceneEnvelopeMessage({
        actorName: actor.display_name,
        recipientConfirmedSteps: recipientProg?.confirmedSteps ?? 0,
        finishThreshold: pair.finish_threshold,
        sceneTitle: scene.title,
      });
      const res = await transport.sendMessage({
        chatId: recipientChatId,
        parseMode: 'HTML',
        text: envelopeText,
        replyMarkup: buildPendingEnvelopeKeyboard(createdEvent.id),
      });
      if (res.ok && res.result?.message_id) {
        await store.updateEventLifecycle(createdEvent.id, {
          result_message_id: String(res.result.message_id),
        });
      }
    }

    if (actorChatId && actorChatId !== recipientChatId) {
      await editOrSendPanel({
        store,
        transport,
        chatId: actorChatId,
        text: [
          `<b>Сцена завершена</b> — ${escapeHtml(scene.title)}`,
          '',
          `Счёт: ${formatScoreboardLine(players, actor.id, pair.finish_threshold)}`,
          recipientChatId
            ? '<i>Друг получил конверт — анимация запустится, когда он откроет её.</i>'
            : '<i>Друг ещё не открыл бота или отключил уведомления.</i>',
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(pair, actor.id)),
      });
    }
  }

  return { ok: true, action: 'miss:ascii_completed' };
}

async function handleCallbackLogAction(params: {
  store: BotStore;
  transport: TelegramTransport;
  actorId: string;
  sourceChatId: string;
  callbackQueryId?: string;
  messageId?: number;
  idempotencyKey: string;
}): Promise<{ ok: true; action: string }> {
  const { store, transport, actorId, sourceChatId, callbackQueryId, messageId, idempotencyKey } =
    params;

  const ctx = await store.getPairContextForUser(actorId);
  const check = validateEventCreation({
    actorId,
    pair: ctx.pair,
    members: ctx.members,
    existingEvents: ctx.events,
    idempotencyKey,
    eventType: 'callback',
  });

  if (!check.ok) {
    if (callbackQueryId) {
      await transport.answerCallbackQuery({ callbackQueryId, text: check.error, showAlert: true });
    } else {
      await transport.sendMessage({ chatId: sourceChatId, text: check.error });
    }
    return { ok: true, action: `callback:rejected:${check.code}` };
  }

  const pair = ctx.pair!;
  const actor = ctx.profiles.find((p) => p.id === actorId)!;
  const recipient = ctx.profiles.find((p) => p.id === check.recipientId)!;

  if (!check.deduplicated) {
    const nowIso = new Date().toISOString();
    await store.createMissedCallEvent({
      pair_id: pair.id,
      actor_id: actor.id,
      recipient_id: recipient.id,
      event_type: 'callback',
      status: 'confirmed',
      steps_awarded: 0,
      note: null,
      target_chat_id: pair.group_chat_id || sourceChatId,
      created_at: nowIso,
      resolved_at: nowIso,
      idempotency_key: idempotencyKey,
    });
  }

  if (callbackQueryId) {
    await transport.answerCallbackQuery({ callbackQueryId, text: 'Перезвон учтён' });
  }

  const freshCtx = await store.getPairContextForUser(actorId);
  const players = buildPlayersProgress(freshCtx);
  const actorProg = players.find((p) => p.userId === actor.id);

  await editOrSendPanel({
    store,
    transport,
    chatId: sourceChatId,
    messageId,
    text: [
      '<b>ПЕРЕЗВОН ЗАФИКСИРОВАН</b>',
      `<i>${escapeHtml(actor.display_name)} перезвонил(а) ${escapeHtml(recipient.display_name)}</i>`,
      '',
      `Всего перезвонов за раунд: <b>${actorProg?.callbacksCount ?? 1}</b>`,
      `Счёт: ${formatScoreboardLine(players, actor.id, pair.finish_threshold)}`,
    ].join('\n'),
    replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(pair, actor.id)),
  });

  return { ok: true, action: 'callback:logged' };
}

async function handleScenePreviewAction(params: {
  store: BotStore;
  transport: TelegramTransport;
  actorId: string;
  sourceChatId: string;
  callbackQueryId?: string;
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
    frameDelayMs,
    finalFrameHoldMs,
    sleep,
    randomFn,
  } = params;

  const ctx = await store.getPairContextForUser(actorId);
  if (!ctx.pair || ctx.pair.status !== 'active') {
    if (callbackQueryId) {
      await transport.answerCallbackQuery({
        callbackQueryId,
        text: 'Сначала свяжите пару.',
        showAlert: true,
      });
    } else {
      await sendNeedsPairMessage(store, transport, sourceChatId, ctx.pair?.invitation_code);
    }
    return { ok: true, action: 'preview:needs_pair' };
  }

  const actor = ctx.profiles.find((p) => p.id === actorId)!;
  const partner = ctx.profiles.find((p) => p.id !== actorId) || actor;
  const scene = pickRandomAsciiScene(ctx.pair.recent_scenes || [], randomFn);

  if (callbackQueryId) {
    await transport.answerCallbackQuery({
      callbackQueryId,
      text: `Превью: ${scene.title}`,
    });
  }

  const frames = renderAsciiSceneFrames(scene, {
    winnerSide: 'left',
    winnerName: actor.display_name,
    loserName: partner.display_name,
    fastMode: Boolean(ctx.pair.fast_animation),
  });

  await playAsciiAnimationSequence({
    transport,
    targetChatIds: [sourceChatId],
    frames,
    frameDelayMs: frameDelayMs ?? scene.frameDelayMs,
    finalFrameHoldMs: finalFrameHoldMs ?? 900,
    sleep,
  });

  await editOrSendPanel({
    store,
    transport,
    chatId: sourceChatId,
    text: [
      `<b>Превью сцены</b> — ${escapeHtml(scene.title)}`,
      `<i>Категория: ${SCENE_TYPE_LABELS[scene.type]} · счёт раунда не изменён</i>`,
    ].join('\n'),
    replyMarkup: buildBackToMenuKeyboard(),
  });

  return { ok: true, action: 'preview:completed' };
}

async function handleReplaySceneAction(params: {
  store: BotStore;
  transport: TelegramTransport;
  cb: TelegramCallbackQuery;
  userId: string;
  eventId: string;
  fallbackChatId: string;
  frameDelayMs?: number;
  finalFrameHoldMs?: number;
  sleep: (ms: number) => Promise<void>;
  randomFn: () => number;
}): Promise<{ ok: true; action: string }> {
  const {
    store,
    transport,
    cb,
    userId,
    eventId,
    fallbackChatId,
    frameDelayMs,
    finalFrameHoldMs,
    sleep,
    randomFn,
  } = params;

  const event = await store.getEventById(eventId);
  if (!event) {
    await transport.answerCallbackQuery({
      callbackQueryId: cb.id,
      text: 'Сцена больше недоступна.',
      showAlert: true,
    });
    return { ok: true, action: 'replay:not_found' };
  }

  const ctx = await store.getPairContextForUser(userId);
  const inPair = ctx.members.some((m) => m.pair_id === event.pair_id && m.user_id === userId);
  if (!ctx.pair || !inPair) {
    await transport.answerCallbackQuery({
      callbackQueryId: cb.id,
      text: 'Вы не можете просматривать сцены чужой пары.',
      showAlert: true,
    });
    return { ok: true, action: 'replay:forbidden' };
  }

  const scene =
    (event.scene_id ? getAsciiSceneById(event.scene_id) : null) ||
    pickRandomAsciiScene([], randomFn);

  await transport.answerCallbackQuery({
    callbackQueryId: cb.id,
    text: `Запуск: ${scene.title}`,
  });

  const pair = ctx.pair;
  const actor = ctx.profiles.find((p) => p.id === event.actor_id);
  const recipient = ctx.profiles.find((p) => p.id === event.recipient_id);
  const actorMember = ctx.members.find((m) => m.user_id === event.actor_id);
  const winnerSide: 'left' | 'right' = actorMember?.lane_index === 1 ? 'right' : 'left';

  const frames = renderAsciiSceneFrames(scene, {
    winnerSide,
    winnerName: actor?.display_name || 'Друг',
    loserName: recipient?.display_name || 'Вы',
    fastMode: Boolean(pair.fast_animation),
  });

  const stepDelayMs = frameDelayMs ?? scene.frameDelayMs;
  const holdMs = finalFrameHoldMs ?? 1200;
  const chatId = cb.message ? String(cb.message.chat.id) : fallbackChatId;
  const msgId = cb.message?.message_id;

  if (msgId && frames.length > 0) {
    for (let i = 0; i < frames.length; i++) {
      if (i > 0 && stepDelayMs > 0) {
        await sleep(stepDelayMs);
      }
      const res = await transport.editMessageText({
        chatId,
        messageId: msgId,
        text: wrapPreHtml(frames[i]),
        parseMode: 'HTML',
      });
      if (!res.ok && res.errorCode === 429 && res.retryAfter) {
        await sleep(Math.min(5000, Math.max(500, res.retryAfter * 1000)));
        await transport.editMessageText({
          chatId,
          messageId: msgId,
          text: wrapPreHtml(frames[i]),
          parseMode: 'HTML',
        });
      }
    }
    if (holdMs > 0) {
      await sleep(holdMs);
    }
  } else {
    await playAsciiAnimationSequence({
      transport,
      targetChatIds: [chatId],
      frames,
      frameDelayMs: stepDelayMs,
      finalFrameHoldMs: holdMs,
      sleep,
    });
  }

  // Re-fetch event & pair state in case status changed during playback
  const latestEvent = (await store.getEventById(event.id)) || event;
  const latestCtx = await store.getPairContextForUser(userId);
  const players = buildPlayersProgress(latestCtx);
  const recipientProg = players.find((p) => p.userId === latestEvent.recipient_id);
  const scoreLines = players
    .map(
      (p) =>
        `${escapeHtml(p.profile.display_name)} — <b>${p.confirmedSteps}/${pair.finish_threshold}</b>`
    )
    .join('\n');

  let finalText: string;
  let finalMarkup: InlineKeyboardMarkup;

  if (latestEvent.status === 'pending') {
    finalText = formatPermanentShameMessage({
      actorName: actor?.display_name || 'Друг',
      recipientName: recipient?.display_name || 'Вы',
      recipientConfirmedSteps: recipientProg?.confirmedSteps ?? 0,
      recipientPendingSteps: recipientProg?.pendingSteps ?? 1,
      finishThreshold: pair.finish_threshold,
      players,
      sceneTitle: scene.title,
    });
    finalMarkup = buildEventReactionKeyboard(latestEvent.id);
  } else if (latestEvent.status === 'disputed') {
    finalText = [
      `<b>СПОРНОЕ СОБЫТИЕ</b>`,
      `<i>${escapeHtml(recipient?.display_name || 'Игрок')} оспаривает пропуск · шаг заморожен</i>`,
      '',
      '<b>Счёт раунда</b>',
      scoreLines,
    ].join('\n');
    finalMarkup = buildDisputedEventKeyboard(latestEvent.id);
  } else if (latestEvent.status === 'confirmed') {
    finalText = [
      `<b>ПРОПУСК ПРИЗНАН</b>`,
      `<i>${escapeHtml(recipient?.display_name || 'Игрок')} · +1 шаг · «${escapeHtml(recipientProg?.currentRank.title || '')}»</i>`,
      '',
      '<b>Счёт раунда</b>',
      scoreLines,
    ].join('\n');
    finalMarkup = buildMainMenuKeyboard(buildPairSettingsUrl(pair, userId));
  } else {
    finalText = [
      `<b>СОБЫТИЕ ОТМЕНЕНО</b>`,
      `<i>${escapeHtml(actor?.display_name || 'Игрок')} снял(а) отметку</i>`,
      '',
      '<b>Счёт раунда</b>',
      scoreLines,
    ].join('\n');
    finalMarkup = buildMainMenuKeyboard(buildPairSettingsUrl(pair, userId));
  }

  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId: msgId,
    text: finalText,
    replyMarkup: finalMarkup,
    rememberPanel: latestEvent.status === 'confirmed' || latestEvent.status === 'cancelled',
  });

  return { ok: true, action: 'replay:completed' };
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
      ? `Признано: ${recipientProg.confirmedSteps}/${pair.finish_threshold}`
      : action === 'dispute'
        ? 'Отмечено как спорное'
        : 'Обвинение снято';

  await transport.answerCallbackQuery({ callbackQueryId: cb.id, text: toastText });

  const chatId = cb.message ? String(cb.message.chat.id) : fallbackChatId;
  const msgId = cb.message?.message_id;

  const scoreLines = players
    .map(
      (p) =>
        `${escapeHtml(p.profile.display_name)} — <b>${p.confirmedSteps}/${pair.finish_threshold}</b>`
    )
    .join('\n');

  if (msgId) {
    if (action === 'confirm') {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        parseMode: 'HTML',
        text: [
          `<b>ПРОПУСК ПРИЗНАН</b>`,
          `<i>${escapeHtml(recipient.display_name)} · +1 шаг · «${escapeHtml(recipientProg.currentRank.title)}»</i>`,
          '',
          '<b>Счёт раунда</b>',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(pair, userId)),
      });
      await store.setChatPanelMessageId(chatId, msgId);
    } else if (action === 'dispute') {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        parseMode: 'HTML',
        text: [
          `<b>СПОРНОЕ СОБЫТИЕ</b>`,
          `<i>${escapeHtml(recipient.display_name)} оспаривает пропуск · шаг заморожен</i>`,
          '',
          '<b>Счёт раунда</b>',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildDisputedEventKeyboard(event.id),
      });
    } else {
      await transport.editMessageText({
        chatId,
        messageId: msgId,
        parseMode: 'HTML',
        text: [
          `<b>СОБЫТИЕ ОТМЕНЕНО</b>`,
          `<i>${escapeHtml(actor.display_name)} снял(а) отметку</i>`,
          '',
          '<b>Счёт раунда</b>',
          scoreLines,
        ].join('\n'),
        replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(pair, userId)),
      });
      await store.setChatPanelMessageId(chatId, msgId);
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
          ? `<b>${escapeHtml(recipient.display_name)}</b> признал(а) пропуск: ${recipientProg.confirmedSteps}/${pair.finish_threshold}`
          : action === 'dispute'
            ? `<b>${escapeHtml(recipient.display_name)}</b> оспаривает пропуск. Шаг заморожен.`
            : `<b>${escapeHtml(actor.display_name)}</b> отменил(а) отметку о пропуске.`;
      await editOrSendPanel({
        store,
        transport,
        chatId: partnerConn.telegram_chat_id,
        text: `${dmStatus}\n\n${scoreLines}`,
        replyMarkup:
          action === 'dispute'
            ? buildDisputedEventKeyboard(event.id)
            : buildMainMenuKeyboard(buildPairSettingsUrl(pair, partner.id)),
        rememberPanel: action !== 'dispute',
      });
    }
  }

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
      finishThreshold: pair.finish_threshold,
      fastMode: Boolean(pair.fast_animation),
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
      await editOrSendPanel({
        store,
        transport,
        chatId: tc,
        text: gameOverText,
        replyMarkup: buildGameOverKeyboard(buildPairSettingsUrl(pair, userId)),
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
        // mark processed anyway
      }
      await store.updateEventLifecycle(ev.id, {
        animation_deleted_at: new Date().toISOString(),
      });
    }
  }

  return { checked: expired.length, deleted };
}

async function sendNeedsPairMessage(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  waitingCode?: string,
  messageId?: number
): Promise<void> {
  if (waitingCode) {
    await editOrSendPanel({
      store,
      transport,
      chatId,
      messageId,
      text: [
        '<b>ОЖИДАНИЕ ВТОРОГО ИГРОКА</b>',
        '',
        `Код пары: <code>${escapeHtml(waitingCode)}</code>`,
        `Друг должен отправить боту: <code>/join ${escapeHtml(waitingCode)}</code>`,
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [
          [
            { text: 'Задать имя', callback_data: 'act:name_prompt' },
            { text: 'Отменить код', callback_data: 'pair:leave_confirm' },
          ],
        ],
      },
    });
    return;
  }

  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: '<b>АЛЛО, ПИДР</b>\n\nСоздайте игровую пару или введите код от друга:',
    replyMarkup: buildUnpairedKeyboard(),
  });
}

async function sendMainMenu(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext,
  messageId?: number
): Promise<void> {
  const me = ctx.profiles.find((p) => p.id === viewerId);
  const partner = ctx.profiles.find((p) => p.id !== viewerId);
  const players = buildPlayersProgress(ctx);

  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: formatWelcomeActiveMessage({
      viewerName: me?.display_name || 'Вы',
      partnerName: partner?.display_name || 'Друг',
      pair: ctx.pair!,
      players,
      viewerId,
    }),
    replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, viewerId)),
  });
}

async function sendScoreView(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext,
  messageId?: number
): Promise<void> {
  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: formatScoreMessage({
      viewerId,
      pair: ctx.pair!,
      players: buildPlayersProgress(ctx),
    }),
    replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, viewerId)),
  });
}

async function sendStatsView(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext,
  messageId?: number
): Promise<void> {
  const stats = computeGameStats({
    pairId: ctx.pair!.id,
    finishThreshold: ctx.pair!.finish_threshold,
    events: ctx.events,
    members: ctx.members,
    profiles: ctx.profiles,
    customRanks: ctx.pair!.custom_ranks,
    roundStartedAt: ctx.pair!.round_started_at ?? null,
  });

  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: formatStatsMessage({
      stats,
      finishThreshold: ctx.pair!.finish_threshold,
      profiles: ctx.profiles,
    }),
    replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, viewerId)),
  });
}

async function sendHistoryView(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext,
  messageId?: number
): Promise<void> {
  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: formatHistoryMessage({
      events: ctx.events,
      profiles: ctx.profiles,
    }),
    replyMarkup: buildMainMenuKeyboard(buildPairSettingsUrl(ctx.pair, viewerId)),
  });
}

async function sendSettingsView(
  store: BotStore,
  transport: TelegramTransport,
  chatId: string,
  viewerId: string,
  ctx: PairContext,
  messageId?: number
): Promise<void> {
  const conn = ctx.botConnections.find((b) => b.user_id === viewerId);
  const enabled = conn?.notification_enabled ?? true;
  await editOrSendPanel({
    store,
    transport,
    chatId,
    messageId,
    text: formatSettingsMessage({
      pair: ctx.pair!,
      notificationsEnabled: enabled,
    }),
    replyMarkup: buildSettingsKeyboard({
      pair: ctx.pair!,
      notificationsEnabled: enabled,
      settingsUrl: buildPairSettingsUrl(ctx.pair, viewerId),
    }),
  });
}
