import type { CallEvent, GameStats, Pair, PlayerProgress, Profile } from '../../src/types/game.js';
import { FINISH_BANNER_TITLE } from '../../src/game/rules.js';
import { escapeHtml } from './asciiUtils.js';
import { resolvePixelCharacter } from './pixelCharacters.js';

export const DEFAULT_WEB_SETTINGS_BASE_URL = 'https://allo-omega-rust.vercel.app';

export function buildPairSettingsUrl(pair?: Pair | null, viewerId?: string): string {
  const configured = (process.env.WEB_APP_URL || process.env.APP_URL || '').trim();
  const base = (
    configured.startsWith('https://') && !configured.includes('run.app')
      ? configured
      : DEFAULT_WEB_SETTINGS_BASE_URL
  ).replace(/\/+$/, '');

  if (!pair?.id || !pair?.web_token) {
    return base;
  }
  const params = new URLSearchParams({
    pair: pair.id,
    token: pair.web_token,
  });
  if (viewerId) {
    params.set('u', viewerId);
  }
  return `${base}/?${params.toString()}`;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export type InlineKeyboardMarkup = {
  inline_keyboard: InlineKeyboardButton[][];
};

/**
 * Slim 2-row main menu: zero cluttered walls of buttons.
 */
export function buildMainMenuKeyboard(settingsUrl?: string): InlineKeyboardMarkup {
  const thirdBtn: InlineKeyboardButton = settingsUrl
    ? { text: 'Настройки ↗', url: settingsUrl }
    : { text: 'Настройки', callback_data: 'act:settings' };

  return {
    inline_keyboard: [
      [{ text: 'Он не поднял трубку', callback_data: 'act:miss' }],
      [
        { text: 'Счёт', callback_data: 'act:score' },
        { text: 'Перезвонил', callback_data: 'act:callback' },
        thirdBtn,
      ],
    ],
  };
}

export function buildUnpairedKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Создать пару', callback_data: 'pair:create' }],
      [
        { text: 'Ввести код', callback_data: 'pair:join_prompt' },
        { text: 'Задать имя', callback_data: 'act:name_prompt' },
      ],
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

export function buildGameOverKeyboard(settingsUrl?: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: 'Новый раунд', callback_data: 'set:reset' }],
      [
        { text: 'Счёт', callback_data: 'act:score' },
        settingsUrl
          ? { text: 'Итоги на сайте ↗', url: settingsUrl }
          : { text: 'Сводка', callback_data: 'act:stats' },
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
  settingsUrl?: string;
}): InlineKeyboardMarkup {
  const { pair, notificationsEnabled, settingsUrl } = params;
  const rows: InlineKeyboardButton[][] = [];

  if (settingsUrl) {
    rows.push([{ text: 'Открыть настройки на сайте ↗', url: settingsUrl }]);
  }

  rows.push([
    { text: 'Сменить имя', callback_data: 'act:name_prompt' },
    {
      text: notificationsEnabled ? 'Уведомления: Вкл' : 'Уведомления: Выкл',
      callback_data: 'set:notif:toggle',
    },
  ]);

  if (pair.group_chat_id) {
    rows.push([{ text: 'Отвязать общий чат', callback_data: 'set:unbind_group' }]);
  }

  rows.push([{ text: 'Выйти из пары', callback_data: 'pair:leave_prompt' }]);
  rows.push([{ text: 'Назад в меню', callback_data: 'act:menu' }]);

  return { inline_keyboard: rows };
}

export function buildMinimalProgressBar(steps: number, threshold: number): string {
  const safeThreshold = Math.max(1, threshold);
  const blocks = 10;
  const filled = Math.min(blocks, Math.round((steps / safeThreshold) * blocks));
  return '▰'.repeat(filled) + '▱'.repeat(blocks - filled);
}

export function buildPixelTrackLine(steps: number, threshold: number, glyph: string): string {
  const safeThreshold = Math.max(1, threshold);
  const blocks = 10;
  const filled = Math.min(blocks, Math.round((steps / safeThreshold) * blocks));
  const track = '▪'.repeat(filled) + '▫'.repeat(blocks - filled);
  return `${glyph} ${track} ⚑`;
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

  const trackLines = players.map((p) => {
    const hero = resolvePixelCharacter(p.profile.pixel_character, p.laneIndex);
    const label = `${p.profile.display_name.slice(0, 12)} · ${hero.name}`;
    const score = `${p.confirmedSteps}/${pair.finish_threshold}`;
    const pad = Math.max(1, 28 - label.length - score.length);
    return `${label}${' '.repeat(pad)}${score}\n${buildPixelTrackLine(p.confirmedSteps, pair.finish_threshold, hero.tgGlyph)}`;
  });

  const modeNote = pair.group_chat_id
    ? 'Общий чат привязан.'
    : 'Имя, пиксельных героев и правила можно настроить на сайте.';

  return [
    '<b>АЛЛО, ПИДР</b>',
    `<i>${escapeHtml(viewerName)} против ${escapeHtml(partnerName)}</i>`,
    '',
    players.length > 0 ? `<pre>${escapeHtml(trackLines.join('\n'))}</pre>` : `Лимит: ${pair.finish_threshold}`,
    me && partner ? `Звание: «${escapeHtml(me.currentRank.title)}»` : null,
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

  const trackLines = players.map((p) => {
    const hero = resolvePixelCharacter(p.profile.pixel_character, p.laneIndex);
    const tag = p.userId === viewerId ? ' (вы)' : '';
    const left = `${p.profile.display_name.slice(0, 11)}${tag} · ${hero.name}`;
    const right = `${p.confirmedSteps}/${pair.finish_threshold}`;
    const pad = Math.max(1, 30 - left.length - right.length);
    return `${left}${' '.repeat(pad)}${right}\n${buildPixelTrackLine(p.confirmedSteps, pair.finish_threshold, hero.tgGlyph)}`;
  });

  const metaLines = players.map((p) => {
    const hero = resolvePixelCharacter(p.profile.pixel_character, p.laneIndex);
    const extras: string[] = [`«${escapeHtml(p.currentRank.title)}»`];
    if (p.pendingSteps > 0) extras.push(`ждёт: ${p.pendingSteps}`);
    if (p.callbacksCount > 0) extras.push(`перезвонов: ${p.callbacksCount}`);
    return `<b>${escapeHtml(p.profile.display_name)}</b> (${hero.name}): ${extras.join(' · ')}`;
  });

  return [
    '<b>СЧЁТ РАУНДА</b>',
    '',
    `<pre>${escapeHtml(trackLines.join('\n'))}</pre>`,
    ...metaLines,
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
    '<b>НАСТРОЙКИ</b>',
    '',
    `Код пары: <code>${escapeHtml(pair.invitation_code)}</code>`,
    `Лимит: <b>${pair.finish_threshold}</b> · Пауза: <b>${pair.cooldown_seconds}с</b>`,
    `Анимация: <b>${pair.fast_animation ? 'Быстрая' : 'Полная'}</b> · Личка: <b>${notificationsEnabled ? 'Вкл' : 'Выкл'}</b>`,
    '',
    '<i>Все настройки и выбор пиксельных персонажей доступны на сайте по кнопке ниже.</i>',
  ].join('\n');
}
