import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalBotStore } from './botStore.js';
import { processTelegramUpdate, cleanupExpiredAnimations } from './botEngine.js';
import { ASCII_GAMEOVER_SCENE, renderAsciiSceneFrames } from './asciiScenes.js';
import { toHash } from './redis.js';

test('game over frames use custom threshold', () => {
  const f = renderAsciiSceneFrames(ASCII_GAMEOVER_SCENE, {
    winnerSide: 'left',
    winnerName: 'A',
    loserName: 'B',
    finishThreshold: 15,
  }).join('\n');
  assert.match(f, /15 \/ 15/);
  assert.match(f, /ТЕЛЕФОН 15 РАЗ/);
  assert.ok(!f.includes('10 / 10'));
  for (const l of f.split('\n')) assert.ok(l.length <= 32, l);
});

test('claim released after processing error, retry succeeds', async () => {
  const store = new LocalBotStore(null);
  const boom = {
    sendMessage: async () => {
      throw new Error('boom');
    },
    editMessageText: async () => ({ ok: true }),
    deleteMessage: async () => ({ ok: true }),
    answerCallbackQuery: async () => ({ ok: true }),
  } as any;
  const upd = {
    update_id: 777001,
    message: { message_id: 1, from: { id: 5, first_name: 'X' }, chat: { id: 5, type: 'private' }, text: '/start' },
  } as any;
  await assert.rejects(processTelegramUpdate(upd, { store, transport: boom }));
  const ok = { ...boom, sendMessage: async () => ({ ok: true, result: { message_id: 1 } }) };
  const r = await processTelegramUpdate(upd, { store, transport: ok });
  assert.equal(r.deduplicated, undefined);
  const r2 = await processTelegramUpdate(upd, { store, transport: ok });
  assert.equal(r2.deduplicated, true);
});

test('cleanup finds and deletes expired animations', async () => {
  const store = new LocalBotStore(null);
  const ev = await store.createMissedCallEvent({
    pair_id: 'p1',
    actor_id: 'a',
    recipient_id: 'b',
    event_type: 'missed_call',
    status: 'pending',
    steps_awarded: 1,
    note: null,
    created_at: new Date().toISOString(),
    resolved_at: null,
    idempotency_key: 'k-cleanup-1',
  } as any);
  await store.updateEventLifecycle(ev.id, {
    target_chat_id: '42',
    animation_message_id: '99',
    animation_expires_at: new Date(Date.now() - 1000).toISOString(),
  });
  const deleted: string[] = [];
  const t = {
    deleteMessage: async (c: any, m: any) => {
      deleted.push(`${c}:${m}`);
      return { ok: true };
    },
  } as any;
  const res = await cleanupExpiredAnimations({ store, transport: t });
  assert.deepEqual(deleted, ['42:99']);
  assert.equal(res.deleted, 1);
  const again = await cleanupExpiredAnimations({ store, transport: t });
  assert.equal(again.checked, 0);
});

test('toHash accepts flat array, object and empty responses from HGETALL', () => {
  assert.deepEqual(toHash(['id', 'p1', 'status', 'waiting']), { id: 'p1', status: 'waiting' });
  assert.deepEqual(toHash({ id: 'p1', n: 10, ok: false }), { id: 'p1', n: '10', ok: 'false' });
  assert.equal(toHash([]), null);
  assert.equal(toHash({}), null);
  assert.equal(toHash(null), null);
});
