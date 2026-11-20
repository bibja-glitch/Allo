import fs from 'node:fs';
import path from 'node:path';
import type { TelegramApiResponse } from './telegramApi.js';

export const BOT_DISPLAY_NAME = 'АЛЛО, РОУД!';

export const BOT_SHORT_DESCRIPTION =
  'АЛЛО, РОУД — минималистичная игра для двух друзей. Не взял трубку — получил +1 шаг к финалу.';

export const BOT_DESCRIPTION = [
  'АЛЛО, РОУД — дуэль на внимательность для двух друзей.',
  '',
  '— Создайте пару и отправьте код другу',
  '— Если друг не поднял телефон — зафиксируйте пропуск',
  '— В чат прилетит короткая ASCII-сцена и счётчик раунда',
  '',
  'Кто первым наберёт лимит пропусков — получает главный титул.',
].join('\n');

export const BOT_COMMANDS: Array<{ command: string; description: string }> = [
  { command: 'start', description: 'Главное меню и создание пары' },
  { command: 'miss', description: 'Он не поднял трубку (+1 шаг)' },
  { command: 'callback', description: 'Отметить перезвон' },
  { command: 'score', description: 'Текущий счёт раунда' },
  { command: 'stats', description: 'Сводка дуэли за неделю' },
  { command: 'history', description: 'Последние события' },
  { command: 'scenes', description: 'Превью случайной ASCII-сцены' },
  { command: 'settings', description: 'Настройки пары' },
  { command: 'join', description: 'Войти в пару по коду' },
  { command: 'menu', description: 'Показать меню' },
];

export const BOT_AVATAR_RELATIVE_PATH = 'src/assets/images/bot_avatar_minimal_1795174484247.jpg';

export function resolveBotAvatarPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), BOT_AVATAR_RELATIVE_PATH),
    path.resolve(process.cwd(), 'dist', BOT_AVATAR_RELATIVE_PATH),
    path.resolve(process.cwd(), 'public/bot-avatar.jpg'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function loadBotAvatarBuffer(): { buffer: Buffer; filename: string; path: string } | null {
  const avatarPath = resolveBotAvatarPath();
  if (!avatarPath) return null;
  try {
    const buffer = fs.readFileSync(avatarPath);
    if (buffer.length === 0) return null;
    return {
      buffer,
      filename: path.basename(avatarPath),
      path: avatarPath,
    };
  } catch {
    return null;
  }
}

export interface DeployProfileTransport {
  setMyCommands(commands: Array<{ command: string; description: string }>): Promise<TelegramApiResponse<boolean>>;
  setMyDescription(description: string): Promise<TelegramApiResponse<boolean>>;
  setMyShortDescription(shortDescription: string): Promise<TelegramApiResponse<boolean>>;
  setMyProfilePhoto(photoBuffer: Buffer, filename: string): Promise<TelegramApiResponse<boolean>>;
}

export interface DeployProfileSyncResult {
  ok: boolean;
  avatarFound: boolean;
  avatarPath: string | null;
  setMyCommands: TelegramApiResponse<boolean>;
  setMyDescription: TelegramApiResponse<boolean>;
  setMyShortDescription: TelegramApiResponse<boolean>;
  setMyProfilePhoto: TelegramApiResponse<boolean> | { ok: false; description: string };
}

/**
 * Applies minimalist visual branding (profile photo, description, short description, clean commands).
 * Intended to run strictly during deploy / setup, never during runtime chat handling.
 */
export async function syncBotVisualProfileOnDeploy(
  transport: DeployProfileTransport
): Promise<DeployProfileSyncResult> {
  const avatar = loadBotAvatarBuffer();

  const [setMyCommands, setMyDescription, setMyShortDescription, setMyProfilePhoto] =
    await Promise.all([
      transport.setMyCommands(BOT_COMMANDS),
      transport.setMyDescription(BOT_DESCRIPTION),
      transport.setMyShortDescription(BOT_SHORT_DESCRIPTION),
      avatar
        ? transport.setMyProfilePhoto(avatar.buffer, avatar.filename)
        : Promise.resolve({
            ok: false as const,
            description: `Avatar file not found (${BOT_AVATAR_RELATIVE_PATH})`,
          }),
    ]);

  return {
    ok:
      Boolean(setMyCommands.ok) &&
      Boolean(setMyDescription.ok) &&
      Boolean(setMyShortDescription.ok) &&
      Boolean(setMyProfilePhoto.ok),
    avatarFound: Boolean(avatar),
    avatarPath: avatar?.path || null,
    setMyCommands,
    setMyDescription,
    setMyShortDescription,
    setMyProfilePhoto,
  };
}
