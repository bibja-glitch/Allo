// Нормализация кода приглашения: на русской раскладке легко набрать кириллические «двойники»
// латинских букв (А, В, С, Е ...), а при копировании попадают пробелы, кавычки и длинные тире.
const CYRILLIC_LOOKALIKES: Record<string, string> = {
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', К: 'K', М: 'M', О: 'O', Р: 'P', Т: 'T', Х: 'X',
};

export function normalizeInviteCode(input: string): string {
  let s = ((input || '').trim().split(/\s+/)[0] || '').toUpperCase();
  s = s.replace(/[\u2010-\u2015\u2212]/g, '-');
  s = s.replace(/[АВСЕНКМОРТХ]/g, (ch) => CYRILLIC_LOOKALIKES[ch] || ch);
  s = s.replace(/[^A-Z0-9-]/g, '');
  // Если ввели только хвост кода («7F3A») — добавляем префикс
  if (/^[A-F0-9]{4}$/.test(s)) s = `ALLO-${s}`;
  return s;
}

export function looksLikeInviteCode(input: string): boolean {
  return /^ALLO-[A-Z0-9]{4,}$/.test(normalizeInviteCode(input));
}
