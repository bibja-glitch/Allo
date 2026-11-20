import crypto from 'node:crypto';
import type { BotConnection, Profile } from '../../src/types/game.js';
import { getRedisClient, hgetallHash, isUpstashConfigured } from './redis.js';

const memoryProfiles = new Map<string, Profile>();
const memoryTgToId = new Map<string, string>();
const memoryConnections = new Map<string, BotConnection>();

export async function upsertTelegramUser(params: {
  telegramId: string;
  privateChatId?: string;
  displayName: string;
  username: string | null;
}): Promise<Profile> {
  const cleanName = params.displayName.trim().slice(0, 32) || 'Игрок';

  if (!isUpstashConfigured()) {
    let profileId = memoryTgToId.get(params.telegramId);
    let profile: Profile;
    if (profileId && memoryProfiles.has(profileId)) {
      profile = memoryProfiles.get(profileId)!;
      profile.display_name = cleanName;
      profile.telegram_username = params.username;
    } else {
      profileId = crypto.randomUUID();
      profile = {
        id: profileId,
        display_name: cleanName,
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
      profile = {
        id: raw.id,
        display_name: cleanName,
        avatar: (raw.avatar as Profile['avatar']) || 'photo_hero',
        telegram_id: params.telegramId,
        telegram_username: params.username,
        created_at: raw.created_at || new Date().toISOString(),
      };
    } else {
      profile = {
        id: existingUserId,
        display_name: cleanName,
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
      display_name: cleanName,
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
