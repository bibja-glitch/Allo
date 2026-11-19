import { joinFrame, stampCenteredText } from './asciiUtils';
import {
  ASCII_SCENES_PART_1,
  type AsciiSceneDefinition,
  type AsciiSceneType,
} from './asciiScenesPart1';
import { ASCII_SCENES_PART_2 } from './asciiScenesPart2';

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
  buildFrames: ({ loserName }) => {
    const shortLoser = loserName.slice(0, 20).toUpperCase();
    const baseFrames: string[][] = [
      [
        '================================',
        '',
        '    [ 10 / 10  FINISH! ]        ',
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
        '    НЕ ПОДНЯЛ ТЕЛЕФОН 10 РАЗ    ',
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
        '      +10 / ТИТУЛ ВРУЧЁН!       ',
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

  // First try scenes that haven't been played recently
  let pool = ASCII_SCENES.filter((s) => !recentSet.has(s.id));

  // If all scenes were played recently, at minimum never repeat the immediately previous one
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
