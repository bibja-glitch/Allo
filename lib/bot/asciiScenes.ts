import { joinFrame, stampCenteredText } from './asciiUtils.js';
import {
  ASCII_SCENES_PART_1,
  type AsciiSceneDefinition,
  type AsciiSceneType,
} from './asciiScenesPart1.js';
import { ASCII_SCENES_PART_2 } from './asciiScenesPart2.js';

export type { AsciiSceneDefinition, AsciiSceneType };

export const ASCII_SCENES: AsciiSceneDefinition[] = [
  ...ASCII_SCENES_PART_1,
  ...ASCII_SCENES_PART_2,
];

export const ASCII_GAMEOVER_SCENE: AsciiSceneDefinition = {
  id: 'ascii_gameover_finale',
  title: '🏆 ФИНАЛ: ЗВАНИЕ ПРИСУЖДЕНО',
  type: 'sport',
  description: 'Торжественное вручение позорного кубка на финише.',
  frameDelayMs: 950,
  durationMs: 950 * 8,
  participants: ['winner', 'loser'],
  buildFrames: ({ loserName, finishThreshold }) => {
    const n = finishThreshold && finishThreshold > 0 ? finishThreshold : 10;
    const center = (text: string) => {
      const t = text.slice(0, 32);
      return ' '.repeat(Math.floor((32 - t.length) / 2)) + t;
    };
    const shortLoser = loserName.slice(0, 20).toUpperCase();
    const baseFrames: string[][] = [
      [
        '================================',
        '',
        center(`[ ${n} / ${n}  FINISH! ]`),
        '',
        '         O            |         ',
        '        /|\\    >>>   [F]        ',
        '        / \\           |         ',
        '================================',
      ],
      [
        '================================',
        '     *  *    *  *    *  *       ',
        '         FINISH LINE!           ',
        '',
        '             \\O/     [F]        ',
        '              |       |         ',
        '             / \\      |         ',
        '================================',
      ],
      [
        '================================',
        '   *   DRUMROLL PLEASE...   *   ',
        '',
        '            .-----.             ',
        '           (  ???  )            ',
        '            \\     /             ',
        '             |___|              ',
        '================================',
      ],
      [
        '================================',
        '  *  *  CROWN INCOMING!  *  *   ',
        '',
        '             \\|||/              ',
        '            [=====]             ',
        '              \\O/               ',
        '              /|\\               ',
        '================================',
      ],
      [
        '================================',
        '   *   *   CHAMPION!   *   *    ',
        '',
        '            .=====.             ',
        '           (| #1  |)            ',
        '            \\_____/             ',
        '              | |               ',
        '================================',
      ],
      [
        '================================',
        '',
        '         GAME  OVER !!          ',
        '',
        '         [  TROPHY  ]           ',
        '         ПРИДУРОК ГОДА!         ',
        '',
        '================================',
      ],
      [
        '================================',
        '  *    *   CONGRATS!   *    *   ',
        '',
        '       G A M E   O V E R        ',
        '',
        center(`НЕ ПОДНЯЛ ТЕЛЕФОН ${n} РАЗ`),
        '',
        '================================',
      ],
      [
        '================================',
        '',
        '         F A T A L I T Y !      ',
        '',
        '           GAME OVER            ',
        '',
        center(`+${n} / ТИТУЛ ВРУЧЁН!`),
        '',
        '================================',
      ],
    ];

    return baseFrames.map((lines, idx) => {
      if (idx === 4 || idx === 6) {
        return joinFrame(stampCenteredText(lines, 9, shortLoser));
      }
      return joinFrame(lines);
    });
  },
};

export function getAsciiSceneById(sceneId: string): AsciiSceneDefinition | null {
  return ASCII_SCENES.find((s) => s.id === sceneId) || null;
}

/**
 * Picks a random scene while strictly avoiding consecutive repeats (`recentSceneIds[0]`)
 * and preferring scenes not played in the recent history window.
 */
export function pickRandomAsciiScene(
  recentSceneIds: string[] = [],
  randomFn: () => number = Math.random
): AsciiSceneDefinition {
  const lastSceneId = recentSceneIds[0] || null;
  const recentSet = new Set(recentSceneIds);

  let pool = ASCII_SCENES.filter((s) => !recentSet.has(s.id));

  if (pool.length === 0) {
    pool = ASCII_SCENES.filter((s) => s.id !== lastSceneId);
  }
  if (pool.length === 0) {
    pool = ASCII_SCENES;
  }

  const raw = randomFn();
  const clamped = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
  const idx = Math.floor(clamped * pool.length);
  return pool[idx];
}

export function renderAsciiSceneFrames(
  scene: AsciiSceneDefinition,
  params: {
    winnerSide: 'left' | 'right';
    winnerName: string;
    loserName: string;
    finishThreshold?: number;
  }
): string[] {
  return scene.buildFrames(params);
}

export function getAsciiSceneInventory(): {
  totalScenes: number;
  byType: Record<string, number>;
  scenes: Array<{
    id: string;
    title: string;
    type: AsciiSceneType;
    description: string;
    durationMs: number;
  }>;
} {
  const byType: Record<string, number> = {};
  for (const s of ASCII_SCENES) {
    byType[s.type] = (byType[s.type] || 0) + 1;
  }
  return {
    totalScenes: ASCII_SCENES.length,
    byType,
    scenes: ASCII_SCENES.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      description: s.description,
      durationMs: s.durationMs,
    })),
  };
}
