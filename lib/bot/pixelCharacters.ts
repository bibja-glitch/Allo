export type PixelCharacterId =
  | 'knight'
  | 'ninja'
  | 'robot'
  | 'cat'
  | 'alien'
  | 'wizard'
  | 'boxer'
  | 'ghost';

export interface PixelCharacterSpec {
  id: PixelCharacterId;
  name: string;
  tagline: string;
  accentHex: string;
  /** Compact 3-char pixel-art glyph for 32-col Telegram <pre> tracks */
  tgGlyph: string;
  /** 12x12 pixel grid: '.' transparent, '#' primary ink, '@' accent color, 'W' highlight white */
  grid: string[];
}

export const PIXEL_CHARACTERS: PixelCharacterSpec[] = [
  {
    id: 'knight',
    name: 'Рыцарь',
    tagline: 'Стальной шлем и визор',
    accentHex: '#E5484D',
    tgGlyph: '▐█▌',
    grid: [
      '....@@@@....',
      '...######...',
      '..########..',
      '..##WWWW##..',
      '..########..',
      '..##....##..',
      '...######...',
      '..###@@###..',
      '..########..',
      '...##..##...',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'ninja',
    name: 'Ниндзя',
    tagline: 'Повязка и тень',
    accentHex: '#E5484D',
    tgGlyph: '▐▀▌',
    grid: [
      '....####....',
      '...######...',
      '..@@@@@@@@..',
      '..##W##W##..',
      '..########..',
      '...######...',
      '..########..',
      '.###@@@@###.',
      '..########..',
      '...##..##...',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'robot',
    name: 'Робот',
    tagline: 'Антенна и диодный экран',
    accentHex: '#2563EB',
    tgGlyph: '▐▓▌',
    grid: [
      '.....@@.....',
      '.....##.....',
      '..########..',
      '.##########.',
      '.##@@##@@##.',
      '.##########.',
      '.##WWWWWW##.',
      '..########..',
      '..###@@###..',
      '...##..##...',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'cat',
    name: 'Кот',
    tagline: 'Острые уши и усы',
    accentHex: '#D97706',
    tgGlyph: '▐^▌',
    grid: [
      '..##....##..',
      '.###....###.',
      '.##########.',
      '.##W####W##.',
      '.####@@####.',
      '..########..',
      '...######...',
      '..########..',
      '..###@@###..',
      '...##..##...',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'alien',
    name: 'Пришелец',
    tagline: 'Сверхсвязь с орбиты',
    accentHex: '#10B981',
    tgGlyph: '▐*▌',
    grid: [
      '..@......@..',
      '...#....#...',
      '..########..',
      '.##########.',
      '.#WW####WW#.',
      '.##########.',
      '..###@@###..',
      '...######...',
      '..###@@###..',
      '...##..##...',
      '...##..##...',
      '..##....##..',
    ],
  },
  {
    id: 'wizard',
    name: 'Маг',
    tagline: 'Шляпа и искра',
    accentHex: '#7C3AED',
    tgGlyph: '▐▲▌',
    grid: [
      '.....@@.....',
      '....####....',
      '...######...',
      '.##########.',
      '..##W##W##..',
      '..########..',
      '...#WWWW#...',
      '..########..',
      '..###@@###..',
      '..########..',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'boxer',
    name: 'Боксёр',
    tagline: 'Готов к нокауту',
    accentHex: '#DC2626',
    tgGlyph: '▐B▌',
    grid: [
      '...######...',
      '..########..',
      '..##W##W##..',
      '..########..',
      '...######...',
      '.@@######@@.',
      '@@@######@@@',
      '.@@######@@.',
      '...######...',
      '...##..##...',
      '...##..##...',
      '..###..###..',
    ],
  },
  {
    id: 'ghost',
    name: 'Призрак',
    tagline: 'Недоступен как связь',
    accentHex: '#0EA5E9',
    tgGlyph: '▐░▌',
    grid: [
      '....####....',
      '...######...',
      '..########..',
      '..#W####W#..',
      '..#W#@@#W#..',
      '..########..',
      '..########..',
      '..########..',
      '..########..',
      '..##.##.##..',
      '.##..##..##.',
      '............',
    ],
  },
];

export const PIXEL_CHARACTER_MAP: Record<PixelCharacterId, PixelCharacterSpec> = Object.fromEntries(
  PIXEL_CHARACTERS.map((c) => [c.id, c])
) as Record<PixelCharacterId, PixelCharacterSpec>;

export function resolvePixelCharacter(id?: string | null, laneIndex: 0 | 1 = 0): PixelCharacterSpec {
  if (id && id in PIXEL_CHARACTER_MAP) {
    return PIXEL_CHARACTER_MAP[id as PixelCharacterId];
  }
  return laneIndex === 1 ? PIXEL_CHARACTER_MAP.cat : PIXEL_CHARACTER_MAP.knight;
}
