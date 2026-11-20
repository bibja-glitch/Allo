import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computePlayerProgress,
  computeStats,
  filterEventsByPeriod,
  formatTelegramShameMessage,
  getRankForSteps,
  resolvePairRecipient,
  validateEventCreation,
  validateEventTransition,
} from './rules.js';
import type { CallEvent, Pair, PairMember, Profile } from '../types/game.js';

const p1: Profile = {
  id: 'user-1',
  display_name: 'Я',
  avatar: 'fox_orange',
  telegram_id: '1001',
  telegram_username: 'me_demo',
  created_at: '2026-11-10T10:00:00Z',
};

const p2: Profile = {
  id: 'user-2',
  display_name: 'Друг',
  avatar: 'frog_green',
  telegram_id: '1002',
  telegram_username: 'friend_demo',
  created_at: '2026-11-10T10:01:00Z',
};

const pair: Pair = {
  id: 'pair-1',
  invitation_code: 'ALLO-777',
  status: 'active',
  finish_threshold: 10,
  cooldown_seconds: 120,
  custom_ranks: null,
  created_at: '2026-11-10T10:00:00Z',
};

const members: PairMember[] = [
  { id: 'pm-1', pair_id: 'pair-1', user_id: 'user-1', lane_index: 0, joined_at: '2026-11-10T10:00:00Z' },
  { id: 'pm-2', pair_id: 'pair-1', user_id: 'user-2', lane_index: 1, joined_at: '2026-11-10T10:01:00Z' },
];

test('1 & 2. Automatic recipient resolution between the two pair members', () => {
  const res1 = resolvePairRecipient('user-1', members);
  assert.equal(res1.ok, true);
  if (res1.ok) assert.equal(res1.recipientId, 'user-2');

  const res2 = resolvePairRecipient('user-2', members);
  assert.equal(res2.ok, true);
  if (res2.ok) assert.equal(res2.recipientId, 'user-1');
});

test('3, 4 & 5. Blocks self-targeting, outsiders, and tampered browser recipient_id', () => {
  const selfTamper = resolvePairRecipient('user-1', members, 'user-1');
  assert.equal(selfTamper.ok, false);
  if (!selfTamper.ok) assert.equal(selfTamper.code, 'RECIPIENT_TAMPERED');

  const strangerTamper = resolvePairRecipient('user-1', members, 'outsider-999');
  assert.equal(strangerTamper.ok, false);
  if (!strangerTamper.ok) assert.equal(strangerTamper.code, 'RECIPIENT_TAMPERED');

  const outsiderActor = resolvePairRecipient('outsider-999', members);
  assert.equal(outsiderActor.ok, false);
  if (!outsiderActor.ok) assert.equal(outsiderActor.code, 'NOT_IN_PAIR');
});

test('6. Prevents duplicate events via idempotency key and enforces cooldown', () => {
  const nowMs = Date.parse('2026-11-18T12:00:00Z');
  const existing: CallEvent[] = [
    {
      id: 'ev-1',
      pair_id: 'pair-1',
      actor_id: 'user-1',
      recipient_id: 'user-2',
      event_type: 'missed_call',
      status: 'pending',
      steps_awarded: 1,
      note: null,
      created_at: '2026-11-18T11:59:30Z',
      resolved_at: null,
      idempotency_key: 'idem-abc-123',
    },
  ];

  const dup = validateEventCreation({
    actorId: 'user-1',
    pair,
    members,
    existingEvents: existing,
    idempotencyKey: 'idem-abc-123',
    nowMs,
  });
  assert.equal(dup.ok, true);
  if (dup.ok) {
    assert.equal(dup.deduplicated, true);
  }

  const tooFast = validateEventCreation({
    actorId: 'user-1',
    pair,
    members,
    existingEvents: existing,
    idempotencyKey: 'idem-xyz-999',
    nowMs,
  });
  assert.equal(tooFast.ok, false);
  if (!tooFast.ok) {
    assert.equal(tooFast.code, 'COOLDOWN_ACTIVE');
    assert.equal(tooFast.retryAfterSeconds, 90);
  }

  const otherPlayer = validateEventCreation({
    actorId: 'user-2',
    pair,
    members,
    existingEvents: existing,
    idempotencyKey: 'idem-friend-1',
    nowMs,
  });
  assert.equal(otherPlayer.ok, true);
  if (otherPlayer.ok) {
    assert.equal(otherPlayer.recipientId, 'user-1');
    assert.equal(otherPlayer.deduplicated, false);
  }
});

test('7 & 8. Confirmation and dispute permissions & progress calculation', () => {
  const pendingEv: CallEvent = {
    id: 'ev-10',
    pair_id: 'pair-1',
    actor_id: 'user-1',
    recipient_id: 'user-2',
    event_type: 'missed_call',
    status: 'pending',
    steps_awarded: 1,
    note: null,
    created_at: '2026-11-18T10:00:00Z',
    resolved_at: null,
    idempotency_key: 'idem-10',
  };

  const selfConfirm = validateEventTransition({
    event: pendingEv,
    userId: 'user-1',
    action: 'confirm',
    members,
  });
  assert.equal(selfConfirm.ok, false);

  const selfDispute = validateEventTransition({
    event: pendingEv,
    userId: 'user-1',
    action: 'dispute',
    members,
  });
  assert.equal(selfDispute.ok, false);

  const dispute = validateEventTransition({
    event: pendingEv,
    userId: 'user-2',
    action: 'dispute',
    members,
  });
  assert.equal(dispute.ok, true);
  if (dispute.ok) assert.equal(dispute.nextStatus, 'disputed');

  const disputedProgress = computePlayerProgress({
    profile: p2,
    laneIndex: 1,
    events: [{ ...pendingEv, status: 'disputed' }],
    finishThreshold: 10,
    botConnected: false,
  });
  assert.equal(disputedProgress.confirmedSteps, 0);
  assert.equal(disputedProgress.disputedCount, 1);

  const confirmedProgress = computePlayerProgress({
    profile: p2,
    laneIndex: 1,
    events: [{ ...pendingEv, status: 'confirmed' }],
    finishThreshold: 10,
    botConnected: false,
  });
  assert.equal(confirmedProgress.confirmedSteps, 1);
  assert.equal(confirmedProgress.remainingSteps, 9);
  assert.equal(confirmedProgress.currentRank.title, 'Новичок без связи');
});

test('9. Ranks and finish threshold detection', () => {
  assert.equal(getRankForSteps(0, 10).current.title, 'На связи (пока что)');
  assert.equal(getRankForSteps(3, 10).current.title, 'Абонент вне зоны совести');
  assert.equal(getRankForSteps(5, 10).current.title, 'Мастер игнорирования');
  assert.equal(getRankForSteps(7, 10).current.title, 'Легенда беззвучного режима');
  assert.equal(getRankForSteps(10, 10).current.title, 'ПРИДУРОК ГОДА');
});

test('10. Period filters & statistics computation', () => {
  const nowMs = Date.parse('2026-11-18T15:00:00Z');
  const events: CallEvent[] = [
    {
      id: 'e1',
      pair_id: 'pair-1',
      actor_id: 'user-1',
      recipient_id: 'user-2',
      event_type: 'missed_call',
      status: 'confirmed',
      steps_awarded: 1,
      note: null,
      created_at: '2026-11-18T13:00:00Z',
      resolved_at: '2026-11-18T13:05:00Z',
      idempotency_key: 'k1',
    },
    {
      id: 'e2',
      pair_id: 'pair-1',
      actor_id: 'user-2',
      recipient_id: 'user-1',
      event_type: 'callback',
      status: 'confirmed',
      steps_awarded: 0,
      note: null,
      created_at: '2026-11-14T12:00:00Z',
      resolved_at: '2026-11-14T12:00:00Z',
      idempotency_key: 'k2',
    },
    {
      id: 'e3',
      pair_id: 'pair-1',
      actor_id: 'user-1',
      recipient_id: 'user-2',
      event_type: 'missed_call',
      status: 'confirmed',
      steps_awarded: 1,
      note: null,
      created_at: '2026-10-01T12:00:00Z',
      resolved_at: '2026-10-01T12:10:00Z',
      idempotency_key: 'k3',
    },
  ];

  assert.equal(filterEventsByPeriod(events, 'today', nowMs).length, 1);
  assert.equal(filterEventsByPeriod(events, '7d', nowMs).length, 2);
  assert.equal(filterEventsByPeriod(events, 'all', nowMs).length, 3);

  const prog1 = computePlayerProgress({ profile: p1, laneIndex: 0, events, finishThreshold: 10, botConnected: false });
  const prog2 = computePlayerProgress({ profile: p2, laneIndex: 1, events, finishThreshold: 10, botConnected: true });
  const stats = computeStats([prog1, prog2], events, nowMs);

  assert.equal(stats.mostMissedUserId, 'user-2');
  assert.equal(stats.mostCallbacksUserId, 'user-2');
  assert.equal(stats.weeklyLeaderUserId, 'user-1');
});

test('11. Telegram shame message uses clean requested copy', () => {
  const text = formatTelegramShameMessage({
    recipientName: 'Друг',
    actorName: 'Я',
    currentSteps: 3,
    finishThreshold: 10,
  });
  assert.match(text, /🚨 ТЕБЯ ПОЙМАЛИ!/);
  assert.match(text, /Ты опять не поднял телефон!/);
  assert.match(text, /\+1 шаг к званию главного придурка\./);
  assert.match(text, /Осталось 6 шагов до финиша 😂/);
});
