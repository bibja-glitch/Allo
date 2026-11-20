import crypto from 'node:crypto';
import type { BotConnection, Profile } from '../../src/types/game.js';
import { PIXEL_CHARACTER_MAP, type PixelCharacterId } from './pixelCharacters.js';
import { getRedisClient, hgetallHash, isUpstashConfigured } from './redis.js';

const memoryProfiles = new Map<string, Profile>();
const memoryTgToId = new Map<string, string>();
const memoryConnections = new Map<string, BotConnection>();
const memoryPanelByChat = new Map<string, number>();
const memoryPendingInput = new Map<string, 'name'>();

function sanitizeDisplayName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 24);
}

export async function upsertTelegramUser(params: {
  telegramId: string;
  privateChatId?: string;
  displayName: string;
  username: string | null;
}): Promise<Profile> {
  const tgName = sanitizeDisplayName(params.displayName) || 'Игрок';

  if (!isUpstashConfigured()) {
    let profileId = memoryTgToId.get(params.telegramId);
    let profile: Profile;
    if (profileId && memoryProfiles.has(profileId)) {
      profile = memoryProfiles.get(profileId)!;
      if (!profile.custom_name) {
        profile.display_name = tgName;
      }
      profile.telegram_username = params.username;
    } else {
      profileId = crypto.randomUUID();
      profile = {
        id: profileId,
        display_name: tgName,
        custom_name: false,
        pixel_character: 'knight',
        avatar: 'photo_hero',
        telegram_id: params.telegramId,
        telegram_username: params.username,
        created_at: new Date().toISOString(),
      };
      memoryProfiles.set(profileId, profile);
      memoryTgToId.set(params.telegramId, profileId);
    }

    if (params.privateChatId) {
      const existingConn = memoryConnections.get(profileId);
      if (existingConn) {
        existingConn.telegram_chat_id = params.privateChatId;
      } else {
        memoryConnections.set(profileId, {
          id: crypto.randomUUID(),
          user_id: profileId,
          telegram_chat_id: params.privateChatId,
          connected_at: new Date().toISOString(),
          notification_enabled: true,
        });
      }
    }
    return profile;
  }

  const redis = getRedisClient();
  const existingUserId = await redis.get<string>(`user_by_tg:${params.telegramId}`);

  let profile: Profile;
  if (existingUserId) {
    const raw = await hgetallHash(redis, `users:${existingUserId}`);
    if (raw && raw.id) {
      const hasCustomName = raw.custom_name === 'true';
      profile = {
        id: raw.id,
        display_name: hasCustomName && raw.display_name ? raw.display_name : tgName,
        custom_name: hasCustomName,
        pixel_character:
          raw.pixel_character && raw.pixel_character in PIXEL_CHARACTER_MAP
            ? (raw.pixel_character as PixelCharacterId)
            : 'knight',
        avatar: (raw.avatar as Profile['avatar']) || 'photo_hero',
        telegram_id: params.telegramId,
        telegram_username: params.username,
        created_at: raw.created_at || new Date().toISOString(),
      };
    } else {
      profile = {
        id: existingUserId,
        display_name: tgName,
        custom_name: false,
        pixel_character: 'knight',
        avatar: 'photo_hero',
        telegram_id: params.telegramId,
        telegram_username: params.username,
        created_at: new Date().toISOString(),
      };
    }
  } else {
    const newId = crypto.randomUUID();
    profile = {
      id: newId,
      display_name: tgName,
      custom_name: false,
      pixel_character: 'knight',
      avatar: 'photo_hero',
      telegram_id: params.telegramId,
      telegram_username: params.username,
      created_at: new Date().toISOString(),
    };
    await redis.set(`user_by_tg:${params.telegramId}`, newId);
  }

  await redis.hset(`users:${profile.id}`, {
    id: profile.id,
    display_name: profile.display_name,
    custom_name: String(Boolean(profile.custom_name)),
    pixel_character: profile.pixel_character || 'knight',
    avatar: profile.avatar,
    telegram_id: profile.telegram_id || '',
    telegram_username: profile.telegram_username || '',
    created_at: profile.created_at,
  });

  if (params.privateChatId) {
    const connKey = `bot_connection:${profile.id}`;
    const existingConn = await hgetallHash(redis, connKey);
    if (existingConn && existingConn.id) {
      await redis.hset(connKey, { telegram_chat_id: params.privateChatId });
    } else {
      await redis.hset(connKey, {
        id: crypto.randomUUID(),
        user_id: profile.id,
        telegram_chat_id: params.privateChatId,
        connected_at: new Date().toISOString(),
        notification_enabled: 'true',
      });
    }
  }

  return profile;
}

export async function updateUserProfile(params: {
  userId: string;
  displayName?: string;
  pixelCharacter?: string;
}): Promise<Profile | null> {
  const cleanName = params.displayName !== undefined ? sanitizeDisplayName(params.displayName) : undefined;
  const validChar =
    params.pixelCharacter && params.pixelCharacter in PIXEL_CHARACTER_MAP
      ? (params.pixelCharacter as PixelCharacterId)
      : undefined;

  if (!isUpstashConfigured()) {
    const profile = memoryProfiles.get(params.userId);
    if (!profile) return null;
    if (cleanName) {
      profile.display_name = cleanName;
      profile.custom_name = true;
    }
    if (validChar) {
      profile.pixel_character = validChar;
    }
    return profile;
  }

  const redis = getRedisClient();
  const patch: Record<string, string> = {};
  if (cleanName) {
    patch.display_name = cleanName;
    patch.custom_name = 'true';
  }
  if (validChar) {
    patch.pixel_character = validChar;
  }
  if (Object.keys(patch).length > 0) {
    await redis.hset(`users:${params.userId}`, patch);
  }
  return await getUserById(params.userId);
}

export async function getUserById(userId: string): Promise<Profile | null> {
  if (!isUpstashConfigured()) {
    return memoryProfiles.get(userId) || null;
  }
  const redis = getRedisClient();
  const raw = await hgetallHash(redis, `users:${userId}`);
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    display_name: raw.display_name || 'Игрок',
    custom_name: raw.custom_name === 'true',
    pixel_character:
      raw.pixel_character && raw.pixel_character in PIXEL_CHARACTER_MAP
        ? (raw.pixel_character as PixelCharacterId)
        : undefined,
    avatar: (raw.avatar as Profile['avatar']) || 'photo_hero',
    telegram_id: raw.telegram_id || null,
    telegram_username: raw.telegram_username || null,
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export async function getBotConnectionByUserId(userId: string): Promise<BotConnection | null> {
  if (!isUpstashConfigured()) {
    return memoryConnections.get(userId) || null;
  }
  const redis = getRedisClient();
  const raw = await hgetallHash(redis, `bot_connection:${userId}`);
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    user_id: raw.user_id || userId,
    telegram_chat_id: raw.telegram_chat_id || '',
    connected_at: raw.connected_at || new Date().toISOString(),
    notification_enabled: raw.notification_enabled !== 'false',
  };
}

export async function setNotificationEnabled(userId: string, enabled: boolean): Promise<void> {
  if (!isUpstashConfigured()) {
    const conn = memoryConnections.get(userId);
    if (conn) conn.notification_enabled = enabled;
    return;
  }
  const redis = getRedisClient();
  await redis.hset(`bot_connection:${userId}`, { notification_enabled: String(enabled) });
}

export async function getChatPanelMessageId(chatId: string): Promise<number | null> {
  if (!isUpstashConfigured()) {
    return memoryPanelByChat.get(chatId) ?? null;
  }
  const val = await getRedisClient().get<string | number>(`chat_panel:${chatId}`);
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export async function setChatPanelMessageId(chatId: string, messageId: number | null): Promise<void> {
  if (!isUpstashConfigured()) {
    if (messageId === null) memoryPanelByChat.delete(chatId);
    else memoryPanelByChat.set(chatId, messageId);
    return;
  }
  const redis = getRedisClient();
  if (messageId === null) {
    await redis.del(`chat_panel:${chatId}`);
  } else {
    await redis.set(`chat_panel:${chatId}`, String(messageId), { ex: 30 * 24 * 60 * 60 });
  }
}

export async function getPendingUserInput(userId: string): Promise<'name' | null> {
  if (!isUpstashConfigured()) {
    return memoryPendingInput.get(userId) ?? null;
  }
  const val = await getRedisClient().get<string>(`pending_input:${userId}`);
  return val === 'name' ? 'name' : null;
}

export async function setPendingUserInput(userId: string, mode: 'name' | null): Promise<void> {
  if (!isUpstashConfigured()) {
    if (mode === null) memoryPendingInput.delete(userId);
    else memoryPendingInput.set(userId, mode);
    return;
  }
  const redis = getRedisClient();
  if (mode === null) {
    await redis.del(`pending_input:${userId}`);
  } else {
    await redis.set(`pending_input:${userId}`, mode, { ex: 600 });
  }
}
