import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalBotStore } from './botStore.js';
import { looksLikeInviteCode, normalizeInviteCode } from './inviteCode.js';

async function user(store: LocalBotStore, tgId: string, name: string) {
  return store.upsertTelegramUser({ telegramId: tgId, privateChatId: tgId, displayName: name, username: null });
}

test('invite code normalization handles Cyrillic lookalikes, dashes and bare suffix', () => {
  assert.equal(normalizeInviteCode(' allo-7f3a '), 'ALLO-7F3A');
  assert.equal(normalizeInviteCode('ALLO–7F3A'), 'ALLO-7F3A'); // длинное тире
  assert.equal(normalizeInviteCode('ALLO-1АЕ2'), 'ALLO-1AE2'); // кириллические А и Е
  assert.equal(normalizeInviteCode('«ALLO-7F3A»'), 'ALLO-7F3A');
  assert.equal(normalizeInviteCode('7f3a'), 'ALLO-7F3A');
  assert.ok(looksLikeInviteCode('ALLO-7F3A'));
  assert.ok(!looksLikeInviteCode('привет'));
});

test('user with own empty waiting pair can still join a friend invite', async () => {
  const store = new LocalBotStore(null);
  const a = await user(store, `ia-${Date.now()}1`, 'A');
  const b = await user(store, `ib-${Date.now()}2`, 'B');
  const pairA = await store.createPair(a.id, null);
  const pairB = await store.createPair(b.id, null); // второй аккаунт тоже нажал «создать приглашение»
  assert.notEqual(pairA.id, pairB.id);

  const joined = await store.joinPairByCode(b.id, pairA.invitation_code.toLowerCase(), null);
  assert.equal(joined.id, pairA.id);
  assert.equal(joined.status, 'active');
  const ctx = await store.getPairContextForUser(b.id);
  assert.equal(ctx.pair?.id, pairA.id);
  // старый пустой код B больше не работает
  await assert.rejects(store.joinPairByCode(a.id, pairB.invitation_code, null), /не найден|уже состоишь/);
});

test('own code, full pair and unknown code give clear errors', async () => {
  const store = new LocalBotStore(null);
  const a = await user(store, `ja-${Date.now()}1`, 'A');
  const b = await user(store, `jb-${Date.now()}2`, 'B');
  const c = await user(store, `jc-${Date.now()}3`, 'C');
  const pairA = await store.createPair(a.id, null);

  await assert.rejects(store.joinPairByCode(a.id, pairA.invitation_code, null), /собственный код/);
  await assert.rejects(store.joinPairByCode(b.id, 'ALLO-ZZZZ', null), /не найден/);

  await store.joinPairByCode(b.id, pairA.invitation_code, null);
  await assert.rejects(store.joinPairByCode(c.id, pairA.invitation_code, null), /уже двое/);

  // Активная пара не заменяется приглашением в другую
  const d = await user(store, `jd-${Date.now()}4`, 'D');
  const pairD = await store.createPair(d.id, null);
  await assert.rejects(store.joinPairByCode(b.id, pairD.invitation_code, null), /уже состоишь/);
});
