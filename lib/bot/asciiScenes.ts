import { joinFrame, stampCenteredText } from './asciiUtils.js';
import {
  ASCII_SCENES_PART_1,
  type AsciiSceneDefinition,
  type AsciiSceneType,
} from './asciiScenesPart1.js';
import { ASCII_SCENES_PART_2 } from './asciiScenesPart2.js';

export type { AsciiSceneDefinition, AsciiSceneType };

export const SCENE_TYPE_LABELS: Record<AsciiSceneType, string> = {
  duel: 'Дуэли',
  animal: 'Звери',
  transport: 'Транспорт',
  magic: 'Магия',
  sci_fi: 'Космос',
  disaster: 'Стихия',
  absurd: 'Абсурд',
  sport: 'Спорт',
};

export const ASCII_SCENES: AsciiSceneDefinition[] = [
  ...ASCII_SCENES_PART_1,
  ...ASCII_SCENES_PART_2,
];

export const ASCII_GAMEOVER_SCENE: AsciiSceneDefinition = {
  id: 'ascii_gameover_finale',
  title: 'Финал раунда',
  type: 'sport',
  description: 'Торжественное вручение титула на финише.',
  frameDelayMs: 900,
  durationMs: 900 * 8,
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
        center(`[ ${n} / ${n}  ФИНИШ! ]`),
        '',
        '         O            |         ',
        '        /|\\    >>>   [F]        ',
        '        / \\           |         ',
        '================================',
      ],
      [
        '================================',
        '     *  *    *  *    *  *       ',
        '        ФИНИШНАЯ ЧЕРТА!         ',
        '',
        '             \\O/     [F]        ',
        '              |       |         ',
        '             / \\      |         ',
        '================================',
      ],
      [
        '================================',
        '  *   БАРАБАННАЯ ДРОБЬ...   *   ',
        '',
        '            .-----.             ',
        '           (  ???  )            ',
        '            \\     /             ',
        '             |___|              ',
        '================================',
      ],
      [
        '================================',
        '    *  *  ЕДЕТ КОРОНА!  *  *    ',
        '',
        '             \\|||/              ',
        '            [=====]             ',
        '              \\O/               ',
        '              /|\\               ',
        '================================',
      ],
      [
        '================================',
        '    *   *   ЧЕМПИОН!   *   *    ',
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
        '          [  КУБОК  ]           ',
        '         ПРИДУРОК ГОДА!         ',
        '',
        '================================',
      ],
      [
        '================================',
        '  *    *  ПОЗДРАВЛЯЕМ!  *    *  ',
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
        '        F A T A L I T Y !       ',
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

export function pickRandomAsciiScene(
  recentSceneIds: string[] = [],
  randomFn: () => number = Math.random,
  filterType?: AsciiSceneType
): AsciiSceneDefinition {
  const catalog = filterType
    ? ASCII_SCENES.filter((s) => s.type === filterType)
    : ASCII_SCENES;
  const source = catalog.length > 0 ? catalog : ASCII_SCENES;

  const lastSceneId = recentSceneIds[0] || null;
  const recentSet = new Set(recentSceneIds);

  let pool = source.filter((s) => !recentSet.has(s.id));

  if (pool.length === 0) {
    pool = source.filter((s) => s.id !== lastSceneId);
  }
  if (pool.length === 0) {
    pool = source;
  }

  const raw = randomFn();
  const clamped = Number.isFinite(raw) ? Math.min(0.999999, Math.max(0, raw)) : 0;
  const idx = Math.floor(clamped * pool.length);
  return pool[idx];
}

/**
 * Selects either full 8-frame sequence or snappy 5-keyframe sequence when fastAnimation is enabled.
 */
export function selectAnimationFrames(frames: string[], fastMode = false): string[] {
  if (!fastMode || frames.length <= 5) return frames;
  return [
    frames[0],
    frames[Math.floor(frames.length * 0.28)],
    frames[Math.floor(frames.length * 0.56)],
    frames[frames.length - 2],
    frames[frames.length - 1],
  ];
}

export function renderAsciiSceneFrames(
  scene: AsciiSceneDefinition,
  params: {
    winnerSide: 'left' | 'right';
    winnerName: string;
    loserName: string;
    finishThreshold?: number;
    fastMode?: boolean;
  }
): string[] {
  const frames = scene.buildFrames(params);
  return selectAnimationFrames(frames, Boolean(params.fastMode));
}

export function getAsciiSceneInventory(): {
  totalScenes: number;
  byType: Record<string, number>;
  scenes: Array<{
    id: string;
    title: string;
    type: AsciiSceneType;
    typeLabel: string;
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
      typeLabel: SCENE_TYPE_LABELS[s.type],
      description: s.description,
      durationMs: s.durationMs,
    })),
  };
}
