import type {
  CallEvent,
  EventStatus,
  EventType,
  GameStats,
  Pair,
  PairMember,
  PlayerProgress,
  Profile,
  RankTier,
} from '../types/game';

export const FINISH_BANNER_TITLE = 'ПРИДУРОК, КОТОРЫЙ НЕ ПОДНЯЛ ТЕЛЕФОН';

export const DEFAULT_RANKS: RankTier[] = [
  { min_steps: 0, title: 'На связи (пока что)' },
  { min_steps: 1, title: 'Новичок без связи' },
  { min_steps: 3, title: 'Абонент вне зоны совести' },
  { min_steps: 5, title: 'Мастер игнорирования' },
  { min_steps: 7, title: 'Легенда беззвучного режима' },
  { min_steps: 10, title: 'ПРИДУРОК ГОДА' },
];

export type HistoryPeriod = 'today' | '7d' | '30d' | 'all';

export function buildEffectiveRanks(finishThreshold: number, customRanks?: RankTier[] | null): RankTier[] {
  const safeThreshold = Math.max(3, Math.min(50, Math.round(finishThreshold || 10)));
  if (customRanks && customRanks.length > 0) {
    const sorted = [...customRanks].sort((a, b) => a.min_steps - b.min_steps);
    return sorted;
  }
  if (safeThreshold === 10) {
    return DEFAULT_RANKS;
  }
  // Scale intermediate milestones proportionally when finishThreshold is customized
  return [
    { min_steps: 0, title: DEFAULT_RANKS[0].title },
    { min_steps: 1, title: DEFAULT_RANKS[1].title },
    { min_steps: Math.max(2, Math.round(safeThreshold * 0.3)), title: DEFAULT_RANKS[2].title },
    { min_steps: Math.max(3, Math.round(safeThreshold * 0.5)), title: DEFAULT_RANKS[3].title },
    { min_steps: Math.max(4, Math.round(safeThreshold * 0.7)), title: DEFAULT_RANKS[4].title },
    { min_steps: safeThreshold, title: DEFAULT_RANKS[5].title },
  ].filter((tier, idx, arr) => idx === 0 || tier.min_steps > arr[idx - 1].min_steps);
}

export function getRankForSteps(
  confirmedSteps: number,
  finishThreshold: number,
  customRanks?: RankTier[] | null
): { current: RankTier; next: RankTier | null } {
  const ranks = buildEffectiveRanks(finishThreshold, customRanks);
  let current = ranks[0];
  let next: RankTier | null = null;

  for (let i = 0; i < ranks.length; i++) {
    if (confirmedSteps >= ranks[i].min_steps) {
      current = ranks[i];
      next = ranks[i + 1] ?? null;
    } else {
      if (!next) {
        next = ranks[i];
      }
      break;
    }
  }
  return { current, next };
}

export function resolvePairRecipient(
  actorId: string,
  members: PairMember[],
  claimedRecipientId?: string | null
): { ok: true; recipientId: string } | { ok: false; code: string; error: string } {
  if (!actorId) {
    return { ok: false, code: 'UNAUTHORIZED', error: 'Пользователь не авторизован.' };
  }
  if (!members || members.length !== 2) {
    return {
      ok: false,
      code: 'PAIR_INCOMPLETE',
      error: 'В паре должно быть ровно два участника. Пригласите второго игрока.',
    };
  }
  const actorMember = members.find((m) => m.user_id === actorId);
  if (!actorMember) {
    return {
      ok: false,
      code: 'NOT_IN_PAIR',
      error: 'Вы не являетесь участником этой игровой пары.',
    };
  }
  const partner = members.find((m) => m.user_id !== actorId);
  if (!partner || partner.user_id === actorId) {
    return {
      ok: false,
      code: 'SELF_TARGET_FORBIDDEN',
      error: 'Нельзя начислить пропуск самому себе.',
    };
  }
  if (claimedRecipientId && claimedRecipientId !== partner.user_id) {
    return {
      ok: false,
      code: 'RECIPIENT_TAMPERED',
      error: 'Получатель определяется автоматически на сервере. Ручной выбор запрещён.',
    };
  }
  return { ok: true, recipientId: partner.user_id };
}

export interface EventCreationValidationInput {
  actorId: string;
  pair: Pair | null;
  members: PairMember[];
  existingEvents: CallEvent[];
  idempotencyKey: string;
  claimedRecipientId?: string | null;
  eventType?: EventType;
  nowMs?: number;
}

export type EventCreationValidationResult =
  | { ok: true; recipientId: string; deduplicated: false }
  | { ok: true; recipientId: string; deduplicated: true; existingEvent: CallEvent }
  | { ok: false; code: string; error: string; retryAfterSeconds?: number };

export function validateEventCreation(
  input: EventCreationValidationInput
): EventCreationValidationResult {
  const {
    actorId,
    pair,
    members,
    existingEvents,
    idempotencyKey,
    claimedRecipientId,
    eventType = 'missed_call',
    nowMs = Date.now(),
  } = input;

  if (!pair) {
    return { ok: false, code: 'NO_PAIR', error: 'Игровая пара не найдена.' };
  }
  if (pair.status !== 'active') {
    return {
      ok: false,
      code: 'PAIR_WAITING',
      error: 'Пара ещё ждёт второго игрока. Поделитесь кодом приглашения.',
    };
  }

  const recipientCheck = resolvePairRecipient(actorId, members, claimedRecipientId);
  if (!recipientCheck.ok) {
    return recipientCheck;
  }

  if (!idempotencyKey || idempotencyKey.trim().length < 6) {
    return {
      ok: false,
      code: 'INVALID_IDEMPOTENCY',
      error: 'Отсутствует ключ защиты от повторной отправки.',
    };
  }

  // Deduplicate identical requests (e.g., double-tap or network retry)
  const duplicate = existingEvents.find(
    (e) => e.pair_id === pair.id && e.idempotency_key === idempotencyKey
  );
  if (duplicate) {
    return {
      ok: true,
      recipientId: recipientCheck.recipientId,
      deduplicated: true,
      existingEvent: duplicate,
    };
  }

  // Enforce cooldown for missed_call events from same actor
  if (eventType === 'missed_call' && pair.cooldown_seconds > 0) {
    const actorMisses = existingEvents
      .filter(
        (e) =>
          e.pair_id === pair.id &&
          e.actor_id === actorId &&
          e.event_type === 'missed_call' &&
          e.status !== 'cancelled'
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (actorMisses.length > 0) {
      const lastMs = new Date(actorMisses[0].created_at).getTime();
      const elapsedSec = Math.floor((nowMs - lastMs) / 1000);
      if (elapsedSec < pair.cooldown_seconds) {
        const retryAfterSeconds = pair.cooldown_seconds - elapsedSec;
        return {
          ok: false,
          code: 'COOLDOWN_ACTIVE',
          error: `Подождите ещё ${retryAfterSeconds} сек. перед следующим начислением.`,
          retryAfterSeconds,
        };
      }
    }
  }

  return {
    ok: true,
    recipientId: recipientCheck.recipientId,
    deduplicated: false,
  };
}

export type EventResponseAction = 'confirm' | 'dispute' | 'cancel';

export function validateEventTransition(params: {
  event: CallEvent;
  userId: string;
  action: EventResponseAction;
  members: PairMember[];
}): { ok: true; nextStatus: EventStatus } | { ok: false; code: string; error: string } {
  const { event, userId, action, members } = params;

  if (!userId) {
    return { ok: false, code: 'UNAUTHORIZED', error: 'Пользователь не авторизован.' };
  }
  const inPair = members.some((m) => m.pair_id === event.pair_id && m.user_id === userId);
  if (!inPair) {
    return { ok: false, code: 'FORBIDDEN', error: 'Вы не можете управлять событиями чужой пары.' };
  }

  if (event.status === 'cancelled') {
    return { ok: false, code: 'ALREADY_CANCELLED', error: 'Событие уже отменено.' };
  }

  if (action === 'confirm') {
    if (userId !== event.recipient_id) {
      return {
        ok: false,
        code: 'ONLY_RECIPIENT_CAN_CONFIRM',
        error: 'Подтвердить пропуск может только тот, кому его начислили.',
      };
    }
    if (event.status === 'confirmed') {
      return { ok: false, code: 'ALREADY_CONFIRMED', error: 'Событие уже подтверждено.' };
    }
    return { ok: true, nextStatus: 'confirmed' };
  }

  if (action === 'dispute') {
    if (userId !== event.recipient_id) {
      return {
        ok: false,
        code: 'ONLY_RECIPIENT_CAN_DISPUTE',
        error: 'Оспорить событие может только его получатель.',
      };
    }
    if (event.status !== 'pending') {
      return {
        ok: false,
        code: 'CANNOT_DISPUTE',
        error: 'Оспорить можно только событие, ожидающее реакции.',
      };
    }
    return { ok: true, nextStatus: 'disputed' };
  }

  if (action === 'cancel') {
    if (userId !== event.actor_id) {
      return {
        ok: false,
        code: 'ONLY_ACTOR_CAN_CANCEL',
        error: 'Отменить начисление может только автор (или по итогам спора).',
      };
    }
    if (event.status === 'confirmed') {
      return {
        ok: false,
        code: 'CANNOT_CANCEL_CONFIRMED',
        error: 'Нельзя отменить уже признанное нарушение.',
      };
    }
    return { ok: true, nextStatus: 'cancelled' };
  }

  return { ok: false, code: 'INVALID_ACTION', error: 'Неизвестное действие.' };
}

export function computePlayerProgress(params: {
  profile: Profile;
  laneIndex: 0 | 1;
  events: CallEvent[];
  finishThreshold: number;
  customRanks?: RankTier[] | null;
  botConnected: boolean;
  roundStartedAt?: string | null;
}): PlayerProgress {
  const { profile, laneIndex, events, finishThreshold, customRanks, botConnected, roundStartedAt } = params;
  const safeThreshold = Math.max(3, finishThreshold || 10);
  const roundCutoffMs = roundStartedAt ? new Date(roundStartedAt).getTime() : 0;

  let confirmedSteps = 0;
  let pendingSteps = 0;
  let disputedCount = 0;
  let callbacksCount = 0;

  for (const ev of events) {
    if (roundCutoffMs > 0 && new Date(ev.created_at).getTime() < roundCutoffMs) {
      continue;
    }
    if (ev.event_type === 'missed_call' && ev.recipient_id === profile.id) {
      if (ev.status === 'confirmed') {
        confirmedSteps += ev.steps_awarded || 1;
      } else if (ev.status === 'pending') {
        pendingSteps += ev.steps_awarded || 1;
      } else if (ev.status === 'disputed') {
        disputedCount += 1;
      }
    }
    if (ev.event_type === 'callback' && ev.actor_id === profile.id && ev.status !== 'cancelled') {
      callbacksCount += 1;
    }
  }

  const remainingSteps = Math.max(0, safeThreshold - confirmedSteps);
  const progressPercent = Math.min(100, Math.round((confirmedSteps / safeThreshold) * 100));
  const { current, next } = getRankForSteps(confirmedSteps, safeThreshold, customRanks);

  return {
    userId: profile.id,
    profile,
    laneIndex,
    confirmedSteps,
    pendingSteps,
    disputedCount,
    callbacksCount,
    remainingSteps,
    progressPercent,
    currentRank: current,
    nextRank: next,
    hasReachedFinish: confirmedSteps >= safeThreshold,
    botConnected,
  };
}

export function computeCooldownRemaining(
  actorId: string,
  pair: Pair | null,
  events: CallEvent[],
  nowMs = Date.now()
): number {
  if (!pair || pair.cooldown_seconds <= 0) return 0;
  const latest = events
    .filter(
      (e) =>
        e.pair_id === pair.id &&
        e.actor_id === actorId &&
        e.event_type === 'missed_call' &&
        e.status !== 'cancelled'
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!latest) return 0;
  const elapsed = Math.floor((nowMs - new Date(latest.created_at).getTime()) / 1000);
  return Math.max(0, pair.cooldown_seconds - elapsed);
}

export function filterEventsByPeriod(
  events: CallEvent[],
  period: HistoryPeriod,
  nowMs = Date.now()
): CallEvent[] {
  if (period === 'all') return events;
  const now = new Date(nowMs);
  let cutoffMs = 0;

  if (period === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    cutoffMs = startOfDay;
  } else if (period === '7d') {
    cutoffMs = nowMs - 7 * 24 * 60 * 60 * 1000;
  } else if (period === '30d') {
    cutoffMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  }

  return events.filter((e) => new Date(e.created_at).getTime() >= cutoffMs);
}

export function computeStats(
  players: PlayerProgress[],
  events: CallEvent[],
  nowMs = Date.now()
): GameStats {
  const weekCutoff = nowMs - 7 * 24 * 60 * 60 * 1000;
  const monthCutoff = nowMs - 30 * 24 * 60 * 60 * 1000;

  const activeEvents = events.filter((e) => e.status !== 'cancelled');
  const weekEvents = activeEvents.filter((e) => new Date(e.created_at).getTime() >= weekCutoff);
  const monthEvents = activeEvents.filter((e) => new Date(e.created_at).getTime() >= monthCutoff);

  const weeklyBreakdown = players.map((p) => {
    const missedWeek = weekEvents.filter(
      (e) => e.event_type === 'missed_call' && e.recipient_id === p.userId && e.status === 'confirmed'
    ).length;
    const callbacksWeek = weekEvents.filter(
      (e) => e.event_type === 'callback' && e.actor_id === p.userId
    ).length;
    const missedMonth = monthEvents.filter(
      (e) => e.event_type === 'missed_call' && e.recipient_id === p.userId && e.status === 'confirmed'
    ).length;

    return {
      userId: p.userId,
      displayName: p.profile.display_name,
      missedWeek,
      callbacksWeek,
      missedMonth,
      confirmedTotal: p.confirmedSteps,
      currentRankTitle: p.currentRank.title,
    };
  });

  const sortedByMisses = [...weeklyBreakdown].sort((a, b) => b.confirmedTotal - a.confirmedTotal);
  const mostMissedUserId =
    sortedByMisses.length > 0 && sortedByMisses[0].confirmedTotal > 0
      ? sortedByMisses[0].userId
      : null;

  const sortedByCallbacks = [...players].sort((a, b) => b.callbacksCount - a.callbacksCount);
  const mostCallbacksUserId =
    sortedByCallbacks.length > 0 && sortedByCallbacks[0].callbacksCount > 0
      ? sortedByCallbacks[0].userId
      : null;

  // Weekly leader = fewest missed calls this week (with tie-breaker on more callbacks)
  const sortedWeeklyLeader = [...weeklyBreakdown].sort((a, b) => {
    if (a.missedWeek !== b.missedWeek) return a.missedWeek - b.missedWeek;
    return b.callbacksWeek - a.callbacksWeek;
  });
  const weeklyLeaderUserId =
    sortedWeeklyLeader.length === 2 &&
    (sortedWeeklyLeader[0].missedWeek !== sortedWeeklyLeader[1].missedWeek ||
      sortedWeeklyLeader[0].callbacksWeek !== sortedWeeklyLeader[1].callbacksWeek)
      ? sortedWeeklyLeader[0].userId
      : null;

  return {
    totalConfirmedMisses: players.reduce((sum, p) => sum + p.confirmedSteps, 0),
    totalCallbacks: players.reduce((sum, p) => sum + p.callbacksCount, 0),
    weekEventsCount: weekEvents.length,
    monthEventsCount: monthEvents.length,
    mostMissedUserId,
    mostCallbacksUserId,
    weeklyLeaderUserId,
    weeklyBreakdown,
  };
}

export function formatTelegramShameMessage(params: {
  recipientName: string;
  actorName: string;
  currentSteps: number;
  finishThreshold: number;
}): string {
  const projectedSteps = params.currentSteps + 1;
  const remaining = Math.max(0, params.finishThreshold - projectedSteps);

  return [
    '🚨 ТЕБЯ ПОЙМАЛИ!',
    '',
    'Ты опять не поднял телефон!',
    '',
    '+1 шаг к званию главного придурка.',
    '',
    remaining === 0
      ? 'Финиш достигнут! 😂'
      : `Осталось ${remaining} шагов до финиша 😂`,
  ].join('\n');
}
