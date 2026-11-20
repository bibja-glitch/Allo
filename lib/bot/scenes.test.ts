import test from 'node:test';
import assert from 'node:assert/strict';
import { ASCII_GAMEOVER_SCENE, ASCII_SCENES } from './asciiScenes.js';

// Латиница, которая остаётся намеренно: GAME OVER (по требованию) и элемент рисунка «xOx» (мёртвое лицо).
const ALLOWED_LATIN = new Set(['GAME', 'OVER', 'xOx']);

test('all ASCII scenes: frames fit 32 columns and contain no untranslated English text', () => {
  for (const scene of [...ASCII_SCENES, ASCII_GAMEOVER_SCENE]) {
    for (const side of ['left', 'right'] as const) {
      const frames = scene.buildFrames({ winnerSide: side, winnerName: 'Аня', loserName: 'Боря', finishThreshold: 10 });
      assert.ok(frames.length >= 2, `${scene.id}: too few frames`);
      for (const frame of frames) {
        for (const line of frame.split('\n')) {
          assert.ok(line.length <= 32, `${scene.id}/${side}: line longer than 32: ${JSON.stringify(line)}`);
          for (const word of line.match(/[A-Za-z]{2,}/g) || []) {
            assert.ok(ALLOWED_LATIN.has(word), `${scene.id}/${side}: untranslated "${word}" in ${JSON.stringify(line)}`);
          }
        }
      }
    }
  }
});

test('final frame keeps F A T A L I T Y and GAME OVER, rest is Russian', () => {
  const frames = ASCII_SCENES[0].buildFrames({ winnerSide: 'left', winnerName: 'Аня', loserName: 'Боря' });
  const last = frames[frames.length - 1];
  assert.match(last, /F A T A L I T Y !/);
  assert.match(last, /GAME OVER/);
  assert.match(last, /ТЫ НЕ ПОДНЯЛ ТРУБКУ!/);
  assert.ok(!/YOU DIDN/.test(last));
});

test('game over scene shows custom threshold in Russian', () => {
  const text = ASCII_GAMEOVER_SCENE.buildFrames({ winnerSide: 'left', winnerName: 'A', loserName: 'B', finishThreshold: 25 }).join('\n');
  assert.match(text, /25 \/ 25  ФИНИШ!/);
  assert.match(text, /ТЕЛЕФОН 25 РАЗ/);
});
