export const SCENE_WIDTH = 32;
export const SCENE_HEIGHT = 11;

export const FINAL_FATALITY_LINES: string[] = [
  '================================',
  '',
  '        F A T A L I T Y !       ',
  '',
  '           GAME OVER            ',
  '',
  '     ТЫ НЕ ПОДНЯЛ ТРУБКУ!       ',
  '',
  '          +1 ПРОПУСК            ',
  '',
  '================================',
];

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function wrapPreHtml(frame: string): string {
  return `<pre>${escapeHtml(frame)}</pre>`;
}

export function padLine(line: string, width = SCENE_WIDTH): string {
  if (line.length === width) return line;
  if (line.length > width) return line.slice(0, width);
  return line + ' '.repeat(width - line.length);
}

export function normalizeLines(lines: string[], width = SCENE_WIDTH, height = SCENE_HEIGHT): string[] {
  const out: string[] = [];
  for (let i = 0; i < height; i++) {
    out.push(padLine(lines[i] ?? '', width));
  }
  return out;
}

export function joinFrame(lines: string[]): string {
  return normalizeLines(lines).join('\n');
}

export function buildFinalFatalityFrame(): string {
  return joinFrame(FINAL_FATALITY_LINES);
}

const MIRROR_CHAR_MAP: Record<string, string> = {
  '/': '\\',
  '\\': '/',
  '(': ')',
  ')': '(',
  '[': ']',
  ']': '[',
  '{': '}',
  '}': '{',
  '<': '>',
  '>': '<',
  d: 'b',
  b: 'd',
  p: 'q',
  q: 'p',
};

export function mirrorLine(line: string, width = SCENE_WIDTH): string {
  const padded = padLine(line, width);
  let out = '';
  for (let i = padded.length - 1; i >= 0; i--) {
    const ch = padded[i];
    out += MIRROR_CHAR_MAP[ch] ?? ch;
  }
  return out;
}

export function mirrorLines(lines: string[], width = SCENE_WIDTH): string[] {
  return normalizeLines(lines, width).map((l) => mirrorLine(l, width));
}

export function stampCenteredText(
  lines: string[],
  row: number,
  text: string,
  width = SCENE_WIDTH
): string[] {
  const next = normalizeLines(lines, width);
  if (row < 0 || row >= next.length) return next;
  const clean = text.slice(0, width);
  const start = Math.max(0, Math.floor((width - clean.length) / 2));
  const rowChars = next[row].split('');
  for (let i = 0; i < clean.length; i++) {
    rowChars[start + i] = clean[i];
  }
  next[row] = rowChars.join('');
  return next;
}

export function stampTextAt(
  lines: string[],
  row: number,
  col: number,
  text: string,
  width = SCENE_WIDTH
): string[] {
  const next = normalizeLines(lines, width);
  if (row < 0 || row >= next.length) return next;
  const rowChars = next[row].split('');
  for (let i = 0; i < text.length; i++) {
    const x = col + i;
    if (x >= 0 && x < width) {
      rowChars[x] = text[i];
    }
  }
  next[row] = rowChars.join('');
  return next;
}

export interface DirectionalFrameSpec {
  art: string[];
  labels?: Array<{
    row: number;
    text: string;
    align?: 'center' | 'winner' | 'loser';
    col?: number;
    flipCol?: boolean;
  }>;
}

export function renderDirectionalFrame(
  spec: DirectionalFrameSpec,
  winnerSide: 'left' | 'right',
  winnerLabel: string,
  loserLabel: string
): string {
  const base = winnerSide === 'left' ? normalizeLines(spec.art) : mirrorLines(spec.art);
  let out = base;

  if (spec.labels) {
    for (const lbl of spec.labels) {
      if (typeof lbl.col === 'number') {
        const targetCol =
          winnerSide === 'right' && lbl.flipCol
            ? Math.max(0, SCENE_WIDTH - lbl.col - lbl.text.length)
            : lbl.col;
        out = stampTextAt(out, lbl.row, targetCol, lbl.text);
      } else if (lbl.align === 'winner') {
        const short = lbl.text.slice(0, 16);
        const col = winnerSide === 'left' ? 1 : Math.max(0, SCENE_WIDTH - short.length - 1);
        out = stampTextAt(out, lbl.row, col, short);
      } else if (lbl.align === 'loser') {
        const short = lbl.text.slice(0, 16);
        const col = winnerSide === 'left' ? Math.max(0, SCENE_WIDTH - short.length - 1) : 1;
        out = stampTextAt(out, lbl.row, col, short);
      } else {
        out = stampCenteredText(out, lbl.row, lbl.text);
      }
    }
  }

  if (out[0].trim().length === 0) {
    const wTag = `${winnerLabel.slice(0, 9)}*`;
    const lTag = `${loserLabel.slice(0, 9)}`;
    out = stampTextAt(out, 0, winnerSide === 'left' ? 1 : SCENE_WIDTH - wTag.length - 1, wTag);
    out = stampTextAt(out, 0, winnerSide === 'left' ? SCENE_WIDTH - lTag.length - 1 : 1, lTag);
  }

  return out.join('\n');
}
