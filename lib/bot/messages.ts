import type { CallEvent, GameStats, Pair, PlayerProgress, Profile } from '../../src/types/game.js';
import { FINISH_BANNER_TITLE } from '../../src/game/rules.js';
import { escapeHtml } from './asciiUtils.js';

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
      [{ text: 'Он не поднял трубку', callback_data: 'act:miss' }],
      [
        { text: 'Счёт', callback_data: 'act:score' },
        { text: 'История', callback_data: 'act:history' },
      ],
      [
        { text: 'Сводка', callback_data: 'act:stats' },
        { text: 'Перезвонил', callback_data: 'act:callback' },
      ],
      [
        { text: 'Превью сцены', callback_data: 'act:preview' },
        { text: 'Настройки', callback_data: 'act:settings' },
      ],
    ],
  };
}

export function buildUnpairedKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Создать пару', callback_data: 'pair:create' }],
      [{ text: 'Ввести код приглашения', callback_data: 'pair:join_prompt' }],
    ],
  };
}

export function buildEventReactionKeyboard(eventId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Признаю', callback_data: `confirm:${eventId}` },
        { text: 'Оспорить', callback_data: `dispute:${eventId}` },
      ],
      [{ text: 'Повторить сцену', callback_data: `replay:${eventId}` }],
    ],
  };
}

export function buildPendingEnvelopeKeyboard(eventId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Открыть сцену', callback_data: `replay:${eventId}` }],
      [
        { text: 'Признаю', callback_data: `confirm:${eventId}` },
        { text: 'Оспорить', callback_data: `dispute:${eventId}` },
      ],
    ],
  };
}

export function buildDisputedEventKeyboard(eventId: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Признаю', callback_data: `confirm:${eventId}` },
        { text: 'Отменить', callback_data: `cancel:${eventId}` },
      ],
      [{ text: 'Повторить сцену', callback_data: `replay:${eventId}` }],
    ],
  };
}

export function buildGameOverKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Новый раунд', callback_data: 'set:reset' }],
      [
        { text: 'Счёт', callback_data: 'act:score' },
        { text: 'Сводка', callback_data: 'act:stats' },
      ],
    ],
  };
}

export function buildBackToMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: 'Он не поднял трубку', callback_data: 'act:miss' },
        { text: 'Меню', callback_data: 'act:menu' },
      ],
    ],
  };
}

export function buildSettingsKeyboard(params: {
  pair: Pair;
  notificationsEnabled: boolean;
}): InlineKeyboardMarkup {
  const { pair, notificationsEnabled } = params;
  const mark = (active: boolean, label: string) => (active ? `• ${label}` : label);

  const rows: InlineKeyboardButton[][] = [
    [
      { text: mark(pair.finish_threshold === 5, 'Цель: 5'), callback_data: 'set:threshold:5' },
      { text: mark(pair.finish_threshold === 10, '10'), callback_data: 'set:threshold:10' },
      { text: mark(pair.finish_threshold === 15, '15'), callback_data: 'set:threshold:15' },
      { text: mark(pair.finish_threshold === 20, '20'), callback_data: 'set:threshold:20' },
    ],
    [
      { text: mark(pair.cooldown_seconds === 0, 'Пауза: 0с'), callback_data: 'set:cooldown:0' },
      { text: mark(pair.cooldown_seconds === 60, '60с'), callback_data: 'set:cooldown:60' },
      { text: mark(pair.cooldown_seconds === 120, '120с'), callback_data: 'set:cooldown:120' },
    ],
    [
      {
        text: pair.fast_animation ? 'Анимация: Быстрая' : 'Анимация: Полная',
        callback_data: 'set:anim:toggle',
      },
      {
        text: notificationsEnabled ? 'Уведомления: Вкл' : 'Уведомления: Выкл',
        callback_data: 'set:notif:toggle',
      },
    ],
  ];

  if (pair.group_chat_id) {
    rows.push([{ text: 'Отвязать общий чат', callback_data: 'set:unbind_group' }]);
  }

  rows.push([
    { text: 'Сбросить раунд', callback_data: 'set:reset' },
    { text: 'Меню', callback_data: 'act:menu' },
  ]);

  return { inline_keyboard: rows };
}

export function buildMinimalProgressBar(steps: number, threshold: number): string {
  const safeThreshold = Math.max(1, threshold);
  const blocks = 10;
  const filled = Math.min(blocks, Math.round((steps / safeThreshold) * blocks));
  return '▰'.repeat(filled) + '▱'.repeat(blocks - filled);
}

export function formatScoreboardLine(
  players: PlayerProgress[],
  viewerId: string,
  finishThreshold: number
): string {
  return players
    .map((p) => {
      const name = escapeHtml(p.profile.display_name);
      const label = p.userId === viewerId ? `${name} (вы)` : name;
      return `${label} — ${p.confirmedSteps}/${finishThreshold}`;
    })
    .join('  ·  ');
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
  const bar = buildMinimalProgressBar(projectedAfterConfirm, finishThreshold);

  const scoreLines = players
    .map(
      (p) =>
        `${escapeHtml(p.profile.display_name)} — <b>${p.confirmedSteps}/${finishThreshold}</b>`
    )
    .join('\n');

  return [
    '<b>ПРОПУЩЕННЫЙ ЗВОНОК</b>',
    `<i>${escapeHtml(actorName)} → ${escapeHtml(recipientName)} · +1 шаг</i>`,
    '',
    sceneTitle ? `<blockquote>Сцена: ${escapeHtml(sceneTitle)}</blockquote>` : null,
    `<code>${bar}</code>  ${projectedAfterConfirm}/${finishThreshold}`,
    remaining === 0
      ? `До финала 0 шагов — подтвердите для завершения раунда.`
      : `До титула осталось шагов: <b>${remaining}</b>`,
    '',
    '<b>Счёт раунда</b>',
    scoreLines,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function formatUnopenedSceneEnvelopeMessage(params: {
  actorName: string;
  recipientConfirmedSteps: number;
  finishThreshold: number;
  sceneTitle: string;
}): string {
  const { actorName, recipientConfirmedSteps, finishThreshold, sceneTitle } = params;
  const projected = recipientConfirmedSteps + 1;
  const remaining = Math.max(0, finishThreshold - projected);

  return [
    '<b>ПРОПУЩЕННЫЙ ЗВОНОК</b>',
    `<i>${escapeHtml(actorName)} отметил(а) ваш пропуск</i>`,
    '',
    `<blockquote>Сцена «${escapeHtml(sceneTitle)}» ждёт открытия</blockquote>`,
    remaining === 0
      ? 'Нажмите «Открыть сцену» — этот шаг решает финал раунда.'
      : `После просмотра можно признать или оспорить · до финиша останется ${remaining}.`,
  ].join('\n');
}

export function formatGameOverMessage(params: {
  loserName: string;
  finishThreshold: number;
  players: PlayerProgress[];
}): string {
  const scoreLines = params.players
    .map(
      (p) =>
        `${escapeHtml(p.profile.display_name)} — <b>${p.confirmedSteps}/${params.finishThreshold}</b>`
    )
    .join('\n');

  return [
    '<b>GAME OVER</b>',
    '',
    `<blockquote>${escapeHtml(params.loserName)} доходит до финиша (${params.finishThreshold}/${params.finishThreshold}) и забирает титул:\n«${FINISH_BANNER_TITLE}»</blockquote>`,
    '',
    '<b>Итоги раунда</b>',
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

  const duelLine =
    me && partner
      ? `${escapeHtml(me.profile.display_name)} <b>${me.confirmedSteps}/${pair.finish_threshold}</b>  ·  ${escapeHtml(partner.profile.display_name)} <b>${partner.confirmedSteps}/${pair.finish_threshold}</b>`
      : `Лимит раунда: ${pair.finish_threshold} пропусков`;

  const modeNote = pair.group_chat_id
    ? 'Общий чат подключён — сцены приходят в группу.'
    : 'Добавьте бота в общий чат и отправьте там /bind для совместных сцен.';

  return [
    '<b>АЛЛО, РОУД</b>',
    `<i>${escapeHtml(viewerName)} против ${escapeHtml(partnerName)}</i>`,
    '',
    duelLine,
    me ? `Звание: «${escapeHtml(me.currentRank.title)}»` : null,
    '',
    `<i>${modeNote}</i>`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

export function formatScoreMessage(params: {
  viewerId: string;
  pair: Pair;
  players: PlayerProgress[];
}): string {
  const { viewerId, pair, players } = params;

  const blocks = players.map((p) => {
    const isMe = p.userId === viewerId;
    const roleTag = isMe ? ' · вы' : '';
    const bar = buildMinimalProgressBar(p.confirmedSteps, pair.finish_threshold);
    const meta: string[] = [`${p.progressPercent}%`];
    if (p.pendingSteps > 0) meta.push(`ожидает: ${p.pendingSteps}`);
    if (p.disputedCount > 0) meta.push(`споров: ${p.disputedCount}`);
    if (p.callbacksCount > 0) meta.push(`перезвонов: ${p.callbacksCount}`);

    return [
      `<b>${escapeHtml(p.profile.display_name)}</b>${roleTag} — <b>${p.confirmedSteps}/${pair.finish_threshold}</b>`,
      `<code>${bar}</code>  ${meta.join(' · ')}`,
      `<i>«${escapeHtml(p.currentRank.title)}»</i>`,
    ].join('\n');
  });

  return [
    '<b>СЧЁТ РАУНДА</b>',
    '',
    ...blocks.flatMap((b) => [b, '']),
    `<i>Финиш на ${pair.finish_threshold} шагах — «${FINISH_BANNER_TITLE}»</i>`,
  ].join('\n');
}

export function formatStatsMessage(params: {
  stats: GameStats;
  finishThreshold: number;
  profiles: Profile[];
}): string {
  const { stats, finishThreshold, profiles } = params;
  const nameOf = (id: string | null) =>
    id ? escapeHtml(profiles.find((p) => p.id === id)?.display_name || 'Игрок') : '—';

  const breakdownLines = stats.weeklyBreakdown.map((row) => {
    const totalCalls = row.confirmedTotal + row.callbacksWeek;
    const answerRate =
      totalCalls > 0 ? Math.round((row.callbacksWeek / totalCalls) * 100) : 100;
    return [
      `<b>${escapeHtml(row.displayName)}</b>`,
      `Пропуски за 7 дн.: ${row.missedWeek} · Всего: ${row.confirmedTotal}/${finishThreshold}`,
      `Перезвоны за 7 дн.: ${row.callbacksWeek} · Индекс ответа: ${answerRate}%`,
    ].join('\n');
  });

  return [
    '<b>СВОДКА ДУЭЛИ</b>',
    `<i>За последние 7 дней: событий ${stats.weekEventsCount}</i>`,
    '',
    ...breakdownLines.flatMap((l) => [l, '']),
    `Лидер недели (на связи): <b>${nameOf(stats.weeklyLeaderUserId)}</b>`,
    `Чаще пропускает: <b>${nameOf(stats.mostMissedUserId)}</b>`,
    `Чаще перезванивает: <b>${nameOf(stats.mostCallbacksUserId)}</b>`,
  ].join('\n');
}

export function formatHistoryMessage(params: {
  events: CallEvent[];
  profiles: Profile[];
}): string {
  const { events, profiles } = params;
  const recent = events.slice(0, 10);

  if (recent.length === 0) {
    return [
      '<b>ИСТОРИЯ</b>',
      '',
      'Событий пока нет. Нажмите «Он не поднял трубку», когда друг проигнорирует звонок.',
    ].join('\n');
  }

  const nameOf = (id: string) =>
    escapeHtml(profiles.find((p) => p.id === id)?.display_name || 'Игрок');

  const statusMap: Record<string, string> = {
    pending: 'ожидает',
    confirmed: '+1 шаг',
    disputed: 'оспорен',
    cancelled: 'отменён',
  };

  const lines = recent.map((ev, index) => {
    const d = new Date(ev.created_at);
    const stamp = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const actor = nameOf(ev.actor_id);
    const recipient = nameOf(ev.recipient_id);
    if (ev.event_type === 'callback') {
      return `${index + 1}. <code>${stamp}</code> · ${actor} перезвонил(а)`;
    }
    const statusText = statusMap[ev.status] || ev.status;
    return `${index + 1}. <code>${stamp}</code> · ${actor} → ${recipient} — <i>${statusText}</i>`;
  });

  return ['<b>ПОСЛЕДНИЕ СОБЫТИЯ</b>', '', ...lines].join('\n');
}

export function formatSettingsMessage(params: {
  pair: Pair;
  notificationsEnabled: boolean;
}): string {
  const { pair, notificationsEnabled } = params;
  return [
    '<b>НАСТРОЙКИ ПАРЫ</b>',
    '',
    `Код пары: <code>${escapeHtml(pair.invitation_code)}</code>`,
    `Лимит раунда: <b>${pair.finish_threshold}</b> пропусков`,
    `Пауза между отметками: <b>${pair.cooldown_seconds}</b> сек.`,
    `Анимация: <b>${pair.fast_animation ? 'Быстрая (5 кадров)' : 'Полная (8 кадров)'}</b>`,
    `Уведомления в личку: <b>${notificationsEnabled ? 'Включены' : 'Выключены'}</b>`,
    `Общий чат: <b>${pair.group_chat_id ? 'Привязан' : 'Не привязан'}</b>`,
  ].join('\n');
}
