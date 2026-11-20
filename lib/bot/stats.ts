import type { CallEvent, GameStats, PairMember, Profile } from '../../src/types/game.js';
import { computePlayerProgress } from '../../src/game/rules.js';

export function computeGameStats(params: {
  pairId: string;
  finishThreshold: number;
  events: CallEvent[];
  members: PairMember[];
  profiles: Profile[];
  customRanks: any;
  roundStartedAt: string | null;
}): GameStats {
  const { finishThreshold, events, members, profiles, customRanks, roundStartedAt } = params;

  let totalConfirmedMisses = 0;
  let totalCallbacks = 0;
  const nowMs = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

  let weekEventsCount = 0;
  let monthEventsCount = 0;

  const missCountByUser: Record<string, number> = {};
  const callbackCountByUser: Record<string, number> = {};
  const weeklyMissByUser: Record<string, number> = {};
  const weeklyCallbackByUser: Record<string, number> = {};
  const missedMonthByUser: Record<string, number> = {};

  for (const ev of events) {
    const evTime = new Date(ev.created_at).getTime();
    if (nowMs - evTime <= oneWeekMs) weekEventsCount++;
    if (nowMs - evTime <= oneMonthMs) monthEventsCount++;

    if (ev.status === 'confirmed') {
      if (ev.event_type === 'missed_call') {
        totalConfirmedMisses++;
        missCountByUser[ev.recipient_id] = (missCountByUser[ev.recipient_id] || 0) + 1;
        if (nowMs - evTime <= oneWeekMs) {
          weeklyMissByUser[ev.recipient_id] = (weeklyMissByUser[ev.recipient_id] || 0) + 1;
        }
        if (nowMs - evTime <= oneMonthMs) {
          missedMonthByUser[ev.recipient_id] = (missedMonthByUser[ev.recipient_id] || 0) + 1;
        }
      } else if (ev.event_type === 'callback') {
        totalCallbacks++;
        callbackCountByUser[ev.actor_id] = (callbackCountByUser[ev.actor_id] || 0) + 1;
        if (nowMs - evTime <= oneWeekMs) {
          weeklyCallbackByUser[ev.actor_id] = (weeklyCallbackByUser[ev.actor_id] || 0) + 1;
        }
      }
    }
  }

  let mostMissedUserId: string | null = null;
  let maxMisses = -1;
  for (const [uid, count] of Object.entries(missCountByUser)) {
    if (count > maxMisses) {
      maxMisses = count;
      mostMissedUserId = uid;
    }
  }

  let mostCallbacksUserId: string | null = null;
  let maxCb = -1;
  for (const [uid, count] of Object.entries(callbackCountByUser)) {
    if (count > maxCb) {
      maxCb = count;
      mostCallbacksUserId = uid;
    }
  }

  // Weekly leader = fewest missed calls this week (tie-breaker: more callbacks)
  const weeklyBreakdown = members.map((m: PairMember) => {
    const prof = profiles.find((p: Profile) => p.id === m.user_id);
    const prog = computePlayerProgress({
      profile: prof || {
        id: m.user_id,
        display_name: 'Игрок',
        avatar: 'photo_hero',
        telegram_id: null,
        telegram_username: null,
        created_at: new Date().toISOString(),
      },
      laneIndex: m.lane_index,
      events,
      finishThreshold,
      customRanks,
      botConnected: true,
      roundStartedAt,
    });

    return {
      userId: m.user_id,
      displayName: prog.profile.display_name,
      missedWeek: weeklyMissByUser[m.user_id] || 0,
      callbacksWeek: weeklyCallbackByUser[m.user_id] || 0,
      missedMonth: missedMonthByUser[m.user_id] || 0,
      confirmedTotal: prog.confirmedSteps,
      currentRankTitle: prog.currentRank.title,
    };
  });

  const sortedWeekly = [...weeklyBreakdown].sort((a, b) => {
    if (a.missedWeek !== b.missedWeek) return a.missedWeek - b.missedWeek;
    return b.callbacksWeek - a.callbacksWeek;
  });
  const weeklyLeaderUserId =
    sortedWeekly.length === 2 &&
    (sortedWeekly[0].missedWeek !== sortedWeekly[1].missedWeek ||
      sortedWeekly[0].callbacksWeek !== sortedWeekly[1].callbacksWeek)
      ? sortedWeekly[0].userId
      : null;

  return {
    totalConfirmedMisses,
    totalCallbacks,
    weekEventsCount,
    monthEventsCount,
    mostMissedUserId,
    mostCallbacksUserId,
    weeklyLeaderUserId,
    weeklyBreakdown,
  };
}
