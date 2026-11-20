import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASCII_GAMEOVER_SCENE,
  ASCII_SCENES,
  pickRandomAsciiScene,
  renderAsciiSceneFrames,
} from './asciiScenes.js';
import {
  buildFinalFatalityFrame,
  FINAL_FATALITY_LINES,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  wrapPreHtml,
} from './asciiUtils.js';
import {
  processTelegramUpdate,
  type TelegramTransport,
  type TelegramUpdate,
} from './botEngine.js';
import { LocalBotStore } from './botStore.js';
import type { InlineKeyboardMarkup } from './messages.js';

interface TransportCall {
  type: 'sendMessage' | 'editMessageText' | 'deleteMessage' | 'answerCallbackQuery';
  chatId?: string | number;
  messageId?: string | number;
  text?: string;
  parseMode?: 'HTML';
  replyMarkup?: InlineKeyboardMarkup;
  callbackQueryId?: string;
  showAlert?: boolean;
}

function createMockTransport(options?: {
  failDelete?: boolean;
  simulateRateLimitOnce?: boolean;
  simulateNotModifiedOnce?: boolean;
}) {
  let msgSeq = 100;
  let rateLimitTriggered = false;
  let notModifiedTriggered = false;
  const calls: TransportCall[] = [];
  const sleeps: number[] = [];

  const transport: TelegramTransport = {
    async sendMessage({ chatId, text, parseMode, replyMarkup }) {
      const id = ++msgSeq;
      calls.push({ type: 'sendMessage', chatId, messageId: id, text, parseMode, replyMarkup });
      return { ok: true, result: { message_id: id, chat: { id: Number(chatId), type: 'group' } } };
    },
    async editMessageText({ chatId, messageId, text, parseMode, replyMarkup }) {
      calls.push({ type: 'editMessageText', chatId, messageId, text, parseMode, replyMarkup });

      if (options?.simulateRateLimitOnce && !rateLimitTriggered) {
        rateLimitTriggered = true;
        return {
          ok: false,
          errorCode: 429,
          retryAfter: 1,
          description: 'Too Many Requests: retry after 1',
        };
      }
      if (options?.simulateNotModifiedOnce && !notModifiedTriggered) {
        notModifiedTriggered = true;
        return {
          ok: false,
          errorCode: 400,
          description: 'Bad Request: message is not modified',
        };
      }

      return { ok: true, result: { message_id: Number(messageId), chat: { id: Number(chatId), type: 'group' } } };
    },
    async deleteMessage(chatId, messageId) {
      calls.push({ type: 'deleteMessage', chatId, messageId });
      if (options?.failDelete) {
        return { ok: false, description: 'Bad Request: message cannot be deleted' };
      }
      return { ok: true, result: true };
    },
    async answerCallbackQuery({ callbackQueryId, text, showAlert }) {
      calls.push({ type: 'answerCallbackQuery', callbackQueryId, text, showAlert });
      return { ok: true, result: true };
    },
  };

  return {
    calls,
    sleeps,
    transport,
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
  };
}

test('ASCII 1. Scene catalog has >= 30 unique scenarios with valid 32x11 geometry and exact final splash', () => {
  assert.ok(ASCII_SCENES.length >= 30, `Expected >= 30 scenes, got ${ASCII_SCENES.length}`);
  const ids = new Set(ASCII_SCENES.map((s) => s.id));
  assert.equal(ids.size, ASCII_SCENES.length, 'Scene IDs must be unique');

  const expectedSplash = buildFinalFatalityFrame();
  assert.equal(FINAL_FATALITY_LINES[0], '================================');

  for (const scene of ASCII_SCENES) {
    assert.ok(scene.title.length > 0);
    assert.ok(scene.description.length > 0);
    assert.ok(scene.frameDelayMs >= 900 && scene.frameDelayMs <= 1200);
    assert.ok(scene.participants.length >= 2);

    for (const side of ['left', 'right'] as const) {
      const frames = renderAsciiSceneFrames(scene, {
        winnerSide: side,
        winnerName: 'Кирилл',
        loserName: 'Денис',
      });
      assert.ok(
        frames.length >= 7 && frames.length <= 12,
        `Scene ${scene.id} must have 7-12 frames, got ${frames.length}`
      );

      for (const frame of frames) {
        const rows = frame.split('\n');
        assert.equal(rows.length, SCENE_HEIGHT, `Scene ${scene.id} row height mismatch`);
        for (const r of rows) {
          assert.equal(r.length, SCENE_WIDTH, `Scene ${scene.id} line width mismatch: "${r}"`);
        }
      }

      assert.equal(frames.at(-1), expectedSplash, `Scene ${scene.id} must end with FATALITY splash`);
    }
  }

  // Verify Game Over scene geometry too
  const goFrames = renderAsciiSceneFrames(ASCII_GAMEOVER_SCENE, {
    winnerSide: 'left',
    winnerName: 'Кирилл',
    loserName: 'Денис',
  });
  assert.ok(goFrames.length >= 7 && goFrames.length <= 12);
  for (const f of goFrames) {
    assert.equal(f.split('\n').length, SCENE_HEIGHT);
  }
});

test('ASCII 2. HTML <pre> escaping and directional mirroring keep tags readable and prevent raw < or > bugs', () => {
  const sampleFrame = '<===> O & O <===>';
  const html = wrapPreHtml(sampleFrame);
  assert.equal(html, '<pre>&lt;===&gt; O &amp; O &lt;===&gt;</pre>');

  const classic = ASCII_SCENES.find((s) => s.id === 'classic_fight')!;
  const leftFrames = renderAsciiSceneFrames(classic, {
    winnerSide: 'left',
    winnerName: 'Кирилл',
    loserName: 'Денис',
  });
  const rightFrames = renderAsciiSceneFrames(classic, {
    winnerSide: 'right',
    winnerName: 'Кирилл',
    loserName: 'Денис',
  });

  // Labels like "FIGHT!" and "Кирилл*" must stay un-mirrored on both sides
  assert.match(leftFrames[0], /FIGHT!/);
  assert.match(rightFrames[0], /FIGHT!/);
  assert.match(leftFrames[0], /Кирилл\*/);
  assert.match(rightFrames[0], /Кирилл\*/);

  // Direction of punch/action must differ between left-winner and right-winner
  assert.notEqual(leftFrames[1], rightFrames[1]);

  // Every readable word in ALL 30 mirrored right-winner scenes must stay un-reversed
  for (const scene of ASCII_SCENES) {
    const fL = renderAsciiSceneFrames(scene, { winnerSide: 'left', winnerName: 'Кирилл', loserName: 'Денис' });
    const fR = renderAsciiSceneFrames(scene, { winnerSide: 'right', winnerName: 'Кирилл', loserName: 'Денис' });
    for (let i = 0; i < fR.length - 1; i++) {
      const wordsR = fR[i].split('\n').slice(1).join(' ').match(/[A-Za-zА-Яа-я]{2,}/g) || [];
      const textL = fL[i].split('\n').slice(1).join(' ');
      for (const word of wordsR) {
        assert.ok(textL.includes(word), `Scene ${scene.id} frame ${i} reversed word: ${word}`);
      }
    }
  }
});

test('ASCII 3. Random scene selector never repeats the immediately previous scene', () => {
  const first = pickRandomAsciiScene([], () => 0);
  const second = pickRandomAsciiScene([first.id], () => 0);
  assert.notEqual(second.id, first.id, 'Should never repeat the last played scene');

  // Even when all scenes except one were played recently, picks the unplayed one
  const allExceptLast = ASCII_SCENES.slice(0, -1).map((s) => s.id);
  const picked = pickRandomAsciiScene(allExceptLast, () => 0.5);
  assert.equal(picked.id, ASCII_SCENES.at(-1)!.id);
});

test('Bot 4. End-to-end Telegram ASCII Chaos flow: register -> pair -> group /miss -> sequential editMessageText <pre> -> delete -> permanent shame -> confirm -> ASCII GAME OVER', async () => {
  const store = new LocalBotStore(null);
  const { calls, sleeps, transport, sleep } = createMockTransport();

  const deps = { store, transport, frameDelayMs: 950, finalFrameHoldMs: 1200, sleep };

  const user1 = { id: 10001, first_name: 'Кирилл', username: 'kirill_tg' };
  const user2 = { id: 20002, first_name: 'Денис', username: 'denis_tg' };
  const outsider = { id: 30003, first_name: 'Чужой', username: 'stranger' };

  await processTelegramUpdate(
    {
      update_id: 1,
      message: { message_id: 10, from: user1, chat: { id: 10001, type: 'private' }, text: '/start' },
    },
    deps
  );

  await processTelegramUpdate(
    {
      update_id: 2,
      callback_query: {
        id: 'cb-create',
        from: user1,
        data: 'pair:create',
        message: { message_id: 11, chat: { id: 10001, type: 'private' } },
      },
    },
    deps
  );

  const pairMsg = calls.at(-1)?.text || '';
  const codeMatch = pairMsg.match(/ALLO-[A-F0-9]+/);
  assert.ok(codeMatch);
  const inviteCode = codeMatch[0];

  await processTelegramUpdate(
    {
      update_id: 3,
      message: {
        message_id: 12,
        from: user2,
        chat: { id: 20002, type: 'private' },
        text: `/join ${inviteCode}`,
      },
    },
    deps
  );

  // Outsider blocked
  await processTelegramUpdate(
    {
      update_id: 4,
      message: {
        message_id: 13,
        from: outsider,
        chat: { id: 30003, type: 'private' },
        text: `/join ${inviteCode}`,
      },
    },
    deps
  );
  assert.match(calls.at(-1)?.text || '', /уже двое участников/);

  // Bind group chat & set cooldown=0
  await processTelegramUpdate(
    {
      update_id: 5,
      message: {
        message_id: 14,
        from: user1,
        chat: { id: -100555, type: 'supergroup', title: 'Бро чат' },
        text: '/start',
      },
    },
    deps
  );
  await processTelegramUpdate(
    {
      update_id: 6,
      callback_query: {
        id: 'cb-cooldown-0',
        from: user1,
        data: 'set:cooldown:0',
        message: { message_id: 15, chat: { id: -100555, type: 'supergroup' } },
      },
    },
    deps
  );

  // User 1 presses "🥊 ОН НЕ ПОДНЯЛ ТЕЛЕФОН"
  calls.length = 0;
  sleeps.length = 0;
  const missUpdate: TelegramUpdate = {
    update_id: 7,
    callback_query: {
      id: 'cb-miss-1',
      from: user1,
      data: 'act:miss',
      message: { message_id: 16, chat: { id: -100555, type: 'supergroup' } },
    },
  };
  await processTelegramUpdate(missUpdate, deps);

  // Verify sequence: answerCallbackQuery -> sendMessage(<pre>) -> editMessageText(<pre>) x7 -> deleteMessage -> sendMessage (permanent shame)
  assert.equal(calls[0].type, 'answerCallbackQuery');

  const initialAscii = calls.find((c) => c.type === 'sendMessage' && c.parseMode === 'HTML');
  assert.ok(initialAscii, 'Should send initial HTML <pre> frame');
  assert.ok(initialAscii.text?.startsWith('<pre>') && initialAscii.text?.endsWith('</pre>'));

  const edits = calls.filter(
    (c) => c.type === 'editMessageText' && c.messageId === initialAscii.messageId
  );
  assert.equal(edits.length, 7, 'Should edit the exact same message 7 times (8 frames total)');
  assert.ok(edits.every((e) => e.parseMode === 'HTML' && e.text?.startsWith('<pre>')));
  assert.ok(edits.at(-1)!.text!.includes('F A T A L I T Y !'));

  assert.deepEqual(sleeps, [950, 950, 950, 950, 950, 950, 950, 1200]);

  const delCall = calls.find((c) => c.type === 'deleteMessage');
  assert.ok(delCall);
  assert.equal(delCall.messageId, initialAscii.messageId);

  const shameCall = calls.find(
    (c) => c.type === 'sendMessage' && c.text?.includes('🚨 ПОЗОРНОЕ СОБЫТИЕ!')
  );
  assert.ok(shameCall);
  assert.match(shameCall.text!, /📵 ТЫ НЕ ПОДНЯЛ ТЕЛЕФОН!/);
  assert.match(shameCall.text!, /Твой друг только что устроил тебе настоящий хаос\./);
  assert.match(shameCall.text!, /\+1 пропуск\./);
  assert.match(shameCall.text!, /До позорного финала осталось 9 шагов\./);
  assert.match(shameCall.text!, /🏆 ПРИДУРОК, КОТОРЫЙ НЕ ПОДНЯЛ ТЕЛЕФОН\./);

  // Duplicate webhook retry ignored
  const prevLen = calls.length;
  const dupRes = await processTelegramUpdate(missUpdate, deps);
  assert.equal(dupRes.deduplicated, true);
  assert.equal(calls.length, prevLen);

  // Check recent_scenes updated so next miss plays a different scene
  const p1Profile = await store.upsertTelegramUser({
    telegramId: '10001',
    displayName: 'Кирилл',
    username: 'kirill_tg',
  });
  let ctx = await store.getPairContextForUser(p1Profile.id);
  assert.equal(ctx.pair?.recent_scenes?.length, 1);
  const firstSceneId = ctx.pair!.recent_scenes![0];

  // Confirm 3 events at threshold=3 -> triggers ASCII GAME OVER sequence
  await store.updateSettings({ userId: p1Profile.id, pairId: ctx.pair!.id, finishThreshold: 3 });

  const ev1Id = shameCall.replyMarkup!.inline_keyboard[0][0].callback_data!.split(':')[1];
  await processTelegramUpdate(
    {
      update_id: 8,
      callback_query: {
        id: 'cb-confirm-1',
        from: user2,
        data: `confirm:${ev1Id}`,
        message: { message_id: Number(shameCall.messageId), chat: { id: -100555, type: 'supergroup' } },
      },
    },
    deps
  );

  // Event #2 & #3 (User 2 accuses User 1 once? No, keep User 1 accusing User 2 to hit 3/3)
  for (let step = 2; step <= 3; step++) {
    calls.length = 0;
    await processTelegramUpdate(
      {
        update_id: 100 + step * 2,
        message: {
          message_id: 500 + step,
          from: user1,
          chat: { id: -100555, type: 'supergroup' },
          text: '/miss',
        },
      },
      deps
    );
    const card = calls.find((c) => c.type === 'sendMessage' && c.text?.includes('🚨 ПОЗОРНОЕ СОБЫТИЕ!'))!;
    const evId = card.replyMarkup!.inline_keyboard[0][0].callback_data!.split(':')[1];

    calls.length = 0;
    await processTelegramUpdate(
      {
        update_id: 101 + step * 2,
        callback_query: {
          id: `cb-confirm-${step}`,
          from: user2,
          data: `confirm:${evId}`,
          message: { message_id: Number(card.messageId), chat: { id: -100555, type: 'supergroup' } },
        },
      },
      deps
    );
  }

  ctx = await store.getPairContextForUser(p1Profile.id);
  assert.equal(ctx.pair!.recent_scenes!.length, 3);
  assert.notEqual(ctx.pair!.recent_scenes![1], ctx.pair!.recent_scenes![2]);
  assert.ok(ctx.pair!.recent_scenes!.includes(firstSceneId));

  const goAnimStart = calls.find((c) => c.type === 'sendMessage' && c.parseMode === 'HTML');
  const goEdits = calls.filter(
    (c) => c.type === 'editMessageText' && c.messageId === goAnimStart?.messageId
  );
  const goMsg = calls.find((c) => c.type === 'sendMessage' && c.text?.includes('GAME OVER!'));
  assert.ok(goAnimStart, 'Should send ASCII GAME OVER animation');
  assert.equal(goEdits.length, 7, 'Should animate all 8 frames of GAME OVER ASCII finale');
  assert.ok(goMsg);
  assert.match(goMsg.text!, /🏆 «ПРИДУРОК, КОТОРЫЙ НЕ ПОДНЯЛ ТЕЛЕФОН»\./);
});

test('Bot 5. Resilience: handles 429 retry_after, "message is not modified", and deleteMessage failure in DM mode', async () => {
  const store = new LocalBotStore(null);
  const { calls, sleeps, transport, sleep } = createMockTransport({
    failDelete: true,
    simulateRateLimitOnce: true,
    simulateNotModifiedOnce: true,
  });
  const deps = { store, transport, frameDelayMs: 950, finalFrameHoldMs: 1000, sleep };

  const u1 = { id: 501, first_name: 'Аня' };
  const p1 = await store.upsertTelegramUser({
    telegramId: '501',
    privateChatId: '501',
    displayName: 'Аня',
    username: null,
  });
  const p2 = await store.upsertTelegramUser({
    telegramId: '502',
    privateChatId: '502',
    displayName: 'Макс',
    username: null,
  });
  const pair = await store.createPair(p1.id);
  await store.joinPairByCode(p2.id, pair.invitation_code);

  await processTelegramUpdate(
    {
      update_id: 9001,
      message: { message_id: 1, from: u1, chat: { id: 501, type: 'private' }, text: '/miss' },
    },
    deps
  );

  // Should have paused once for retry_after (1000ms) in addition to frame sleeps
  assert.ok(sleeps.includes(1000), 'Should wait on Telegram 429 retry_after');

  // Even though deleteMessage failed, permanent shame message MUST reach Макс (502)
  const dmShame = calls.find(
    (c) => c.type === 'sendMessage' && String(c.chatId) === '502' && c.text?.includes('🚨 ПОЗОРНОЕ СОБЫТИЕ!')
  );
  assert.ok(dmShame, 'Final shame message must be delivered when deleteMessage fails');

  // Both actor (501) and recipient (502) received HTML <pre> frames
  assert.ok(calls.some((c) => c.type === 'sendMessage' && String(c.chatId) === '501' && c.parseMode === 'HTML'));
  assert.ok(calls.some((c) => c.type === 'sendMessage' && String(c.chatId) === '502' && c.parseMode === 'HTML'));
});
