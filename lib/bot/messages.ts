import type { CallEvent, Pair, PlayerProgress, Profile } from '../../src/types/game.js';
import { FINISH_BANNER_TITLE } from '../../src/game/rules.js';

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

export function buildMainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🥊 ОН НЕ ПОДНЯЛ ТЕЛЕФОН', callback_data: 'act:miss' }],
      [
        { text: '📊 МОЙ СЧЁТ', callback_data: 'act:score' },
        { text: '📜 ИСТОРИЯ', callback_data: 'act:history' },
      ],
      [{ text: '⚙️ НАСТРОЙКИ', callback_data: 'act:settings' }],
    ],
  };
}

export function buildUnpairedKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🆕 Создать игровую пару', callback_data: 'pair:create' }],
      [{ text: '🔗 Ввести код приглашения', callback_data: 'pair:join_prompt' }],
    ],
  };
}

export function buildEventReactionKeyboard(eventId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '😂 Признаю', callback_data: `confirm:${eventId}` },
        { text: '🤨 Оспорить', callback_data: `dispute:${eventId}` },
      ],
    ],
  };
}

export function buildDisputedEventKeyboard(eventId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '😂 Ладно, признаю', callback_data: `confirm:${eventId}` },
        { text: '🕊️ Отменить (автор)', callback_data: `cancel:${eventId}` },
      ],
    ],
  };
}

export function buildGameOverKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '🔄 Начать новый раунд', callback_data: 'set:reset' }],
      [
        { text: '📊 СЧЁТ', callback_data: 'act:score' },
        { text: '📜 ИСТОРИЯ', callback_data: 'act:history' },
      ],
    ],
  };
}

export function buildSettingsKeyboard(params: {
  pair: Pair;
  notificationsEnabled: boolean;
}): InlineKeyboardMarkup {
  const { pair, notificationsEnabled } = params;
  const rows: InlineKeyboardButton[][] = [
    [
      {
        text: `${pair.finish_threshold === 5 ? '✅ ' : ''}Цель: 5`,
        callback_data: 'set:threshold:5',
      },
      {
        text: `${pair.finish_threshold === 10 ? '✅ ' : ''}10`,
        callback_data: 'set:threshold:10',
      },
      {
        text: `${pair.finish_threshold === 15 ? '✅ ' : ''}15`,
        callback_data: 'set:threshold:15',
      },
      {
        text: `${pair.finish_threshold === 20 ? '✅ ' : ''}20`,
        callback_data: 'set:threshold:20',
      },
    ],
    [
      {
        text: `${pair.cooldown_seconds === 0 ? '✅ ' : ''}Пауза: 0с`,
        callback_data: 'set:cooldown:0',
      },
      {
        text: `${pair.cooldown_seconds === 60 ? '✅ ' : ''}60с`,
        callback_data: 'set:cooldown:60',
      },
      {
        text: `${pair.cooldown_seconds === 120 ? '✅ ' : ''}120с`,
        callback_data: 'set:cooldown:120',
      },
    ],
    [
      {
        text: notificationsEnabled ? '🔔 Уведомления: ВКЛ' : '🔕 Уведомления: ВЫКЛ',
        callback_data: 'set:notif:toggle',
      },
    ],
  ];

  if (pair.group_chat_id) {
    rows.push([{ text: '💬 Отвязать общий чат', callback_data: 'set:unbind_group' }]);
  }

  rows.push([
    { text: '🔄 Сбросить раунд', callback_data: 'set:reset' },
    { text: '🏠 Меню', callback_data: 'act:menu' },
  ]);

  return { inline_keyboard: rows };
}

export function buildPixelProgressBar(steps: number, threshold: number): string {
  const safeThreshold = Math.max(1, threshold);
  const blocks = 10;
  const filled = Math.min(blocks, Math.round((steps / safeThreshold) * blocks));
  return '🟥'.repeat(filled) + '⬜'.repeat(blocks - filled);
}

export function formatScoreboardLine(
  players: PlayerProgress[],
  viewerId: string,
  finishThreshold: number
): string {
  return players
    .map((p) => {
      const label = p.userId === viewerId ? `Ты (${p.profile.display_name})` : p.profile.display_name;
      return `${label} — ${p.confirmedSteps}/${finishThreshold}`;
    })
    .join(' · ');
}

export function formatPermanentShameMessage(params: {
  actorName: string;
  recipientName: string;
  recipientConfirmedSteps: number;
  recipientPendingSteps: number;
  finishThreshold: number;
  players: PlayerProgress[];
  sceneTitle?: string;
}): string {
  const {
    actorName,
    recipientName,
    recipientConfirmedSteps,
    finishThreshold,
    players,
    sceneTitle,
  } = params;

  const projectedAfterConfirm = recipientConfirmedSteps + 1;
  const remaining = Math.max(0, finishThreshold - projectedAfterConfirm);

  const scoreLines = players
    .map((p) => `• ${p.profile.display_name} — ${p.confirmedSteps}/${finishThreshold}`)
    .join('\n');

  return [
    '🚨 ПОЗОРНОЕ СОБЫТИЕ!',
    '',
    '📵 ТЫ НЕ ПОДНЯЛ ТЕЛЕФОН!',
    '',
    `Твой друг только что устроил тебе настоящий хаос. (${actorName} 🥊 ${recipientName})`,
    sceneTitle ? `🎬 Сцена: ${sceneTitle}` : null,
    '',
    '+1 пропуск.',
    '',
    remaining === 0
      ? 'До позорного финала осталось 0 шагов — нажми «Признаю» для финала!'
      : `До позорного финала осталось ${remaining} шагов.`,
    '',
    `🏆 ${FINISH_BANNER_TITLE}.`,
    '',
    '📊 Текущий счёт:',
    scoreLines,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function formatGameOverMessage(params: {
  loserName: string;
  finishThreshold: number;
  players: PlayerProgress[];
}): string {
  const scoreLines = params.players
    .map((p) => `• ${p.profile.display_name} — ${p.confirmedSteps}/${params.finishThreshold}`)
    .join('\n');

  return [
    'GAME OVER!',
    '',
    `🏆 «${FINISH_BANNER_TITLE}».`,
    '',
    `💀 ${params.loserName} дошёл до финиша (${params.finishThreshold}/${params.finishThreshold}) и забирает главный титул!`,
    '',
    '📊 Финальный счёт:',
    scoreLines,
  ].join('\n');
}

export function formatWelcomeActiveMessage(params: {
  viewerName: string;
  partnerName: string;
  pair: Pair;
  players: PlayerProgress[];
  viewerId: string;
}): string {
  const { viewerName, partnerName, pair, players, viewerId } = params;
  const me = players.find((p) => p.userId === viewerId);
  const partner = players.find((p) => p.userId !== viewerId);

  return [
    `🕹️ АЛЛО, РОУД! — ASCII CHAOS`,
    '',
    `Боец ${viewerName} на арене против ${partnerName}.`,
    me && partner
      ? `Ты — ${me.confirmedSteps}/${pair.finish_threshold} · ${partner.profile.display_name} — ${partner.confirmedSteps}/${pair.finish_threshold}`
      : `Цель раунда: ${pair.finish_threshold} пропусков.`,
    pair.group_chat_id
      ? '💬 Привязан общий чат: ASCII-сцены выходят прямо туда!'
      : '💡 Добавьте бота в общий чат и напишите там /start — и оба друга увидят ASCII-хаос в одном чате.',
  ].join('\n');
}

export function formatScoreMessage(params: {
  viewerId: string;
  pair: Pair;
  players: PlayerProgress[];
}): string {
  const { viewerId, pair, players } = params;

  const rows = players.map((p) => {
    const isMe = p.userId === viewerId;
    const prefix = isMe ? '👤 Ты' : '🤝 Друг';
    const bar = buildPixelProgressBar(p.confirmedSteps, pair.finish_threshold);
    const extra: string[] = [];
    if (p.pendingSteps > 0) extra.push(`⏳ ожидает: ${p.pendingSteps}`);
    if (p.disputedCount > 0) extra.push(`🤨 споров: ${p.disputedCount}`);

    return [
      `${prefix} (${p.profile.display_name}) — ${p.confirmedSteps}/${pair.finish_threshold}`,
      `${bar} (${p.progressPercent}%)`,
      `🏅 Звание: «${p.currentRank.title}»`,
      extra.length > 0 ? extra.join(' · ') : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '📊 ОБЩИЙ СЧЁТ — АЛЛО, РОУД!',
    '',
    ...rows.flatMap((r) => [r, '']),
    `🏁 Финиш на ${pair.finish_threshold} шагах: «${FINISH_BANNER_TITLE}»`,
  ].join('\n');
}

export function formatHistoryMessage(params: {
  events: CallEvent[];
  profiles: Profile[];
}): string {
  const { events, profiles } = params;
  const recent = events.slice(0, 10);

  if (recent.length === 0) {
    return '📜 ИСТОРИЯ СОБЫТИЙ\n\nПока ни одного пропущенного звонка. Нажмите «🥊 ОН НЕ ПОДНЯЛ ТЕЛЕФОН», когда друг не возьмёт трубку!';
  }

  const nameOf = (id: string) => profiles.find((p) => p.id === id)?.display_name || 'Игрок';
  const statusMap: Record<string, string> = {
    pending: '⏳ Ожидает',
    confirmed: '✅ Признан (+1)',
    disputed: '🤨 Оспорен',
    cancelled: '🕊️ Отменён',
  };

  const lines = recent.map((ev, index) => {
    const d = new Date(ev.created_at);
    const stamp = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const actor = nameOf(ev.actor_id);
    const recipient = nameOf(ev.recipient_id);
    const statusText = statusMap[ev.status] || ev.status;
    return `${index + 1}. [${stamp}] ${actor} 🥊 ${recipient} — ${statusText}`;
  });

  return ['📜 ИСТОРИЯ ПОСЛЕДНИХ 10 СОБЫТИЙ', '', ...lines].join('\n');
}

export function formatSettingsMessage(params: {
  pair: Pair;
  notificationsEnabled: boolean;
}): string {
  const { pair, notificationsEnabled } = params;
  return [
    '⚙️ НАСТРОЙКИ ПАРЫ',
    '',
    `🔑 Код приглашения: ${pair.invitation_code}`,
    `🏁 Финиш: ${pair.finish_threshold} пропусков`,
    `⏱️ Анти-спам пауза: ${pair.cooldown_seconds} сек.`,
    `🔔 Уведомления в личку: ${notificationsEnabled ? 'Включены' : 'Выключены'}`,
    `💬 Общий чат: ${pair.group_chat_id ? 'Привязан ✅' : 'Не привязан (отправь /start в группе)'}`,
  ].join('\n');
}
