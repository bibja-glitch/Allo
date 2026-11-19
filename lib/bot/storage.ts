import crypto from 'node:crypto';
import type { Pair, PairMember, Profile } from '../../src/types/game';
import { getRedisClient, isUpstashConfigured } from './redis';
import { getBotConnectionByUserId } from './users';

interface LocalPairDbData {
  pairs: Map<string, Pair>;
  members: Map<string, PairMember[]>;
  invites: Map<string, string>;
  userPair: Map<string, string>;
}
const localDb: LocalPairDbData = {
  pairs: new Map(),
  members: new Map(),
  invites: new Map(),
  userPair: new Map(),
};

export async function getUserPairId(userId: string): Promise<string | null> {
  if (!isUpstashConfigured()) {
    return localDb.userPair.get(userId) || null;
  }
  const redis = getRedisClient();
  return await redis.get<string>(`user_pair:${userId}`);
}

export async function getPairById(pairId: string): Promise<Pair | null> {
  if (!isUpstashConfigured()) {
    return localDb.pairs.get(pairId) || null;
  }
  const redis = getRedisClient();
  const raw = await redis.hgetall<Record<string, string>>(`pairs:${pairId}`);
  if (!raw || !raw.id) return null;
  return {
    id: raw.id,
    invitation_code: raw.invitation_code,
    status: (raw.status as Pair['status']) || 'waiting',
    finish_threshold: Number(raw.finish_threshold || 10),
    cooldown_seconds: Number(raw.cooldown_seconds || 60),
    custom_ranks: raw.custom_ranks ? JSON.parse(raw.custom_ranks) : null,
    group_chat_id: raw.group_chat_id || null,
    last_animation_file: raw.last_animation_file || null,
    recent_scenes: raw.recent_scenes ? JSON.parse(raw.recent_scenes) : [],
    round_started_at: raw.round_started_at || new Date().toISOString(),
    created_at: raw.created_at || new Date().toISOString(),
  };
}

export async function getPairMembers(pairId: string): Promise<PairMember[]> {
  if (!isUpstashConfigured()) {
    return localDb.members.get(pairId) || [];
  }
  const redis = getRedisClient();
  const rawList = await redis.lrange<string>(`pair_members:${pairId}`, 0, -1);
  return (rawList || []).map((item: string) => JSON.parse(item) as PairMember);
}

export async function createPair(userId: string, groupChatId?: string | null): Promise<Pair> {
  const existingPairId = await getUserPairId(userId);
  if (existingPairId) {
    const p = await getPairById(existingPairId);
    if (p) return p;
  }

  const code = `ALLO-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const pairId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const pair: Pair = {
    id: pairId,
    invitation_code: code,
    status: 'waiting',
    finish_threshold: 10,
    cooldown_seconds: 60,
    custom_ranks: null,
    group_chat_id: groupChatId || null,
    last_animation_file: null,
    recent_scenes: [],
    round_started_at: nowIso,
    created_at: nowIso,
  };

  const member: PairMember = {
    id: crypto.randomUUID(),
    pair_id: pairId,
    user_id: userId,
    lane_index: 0,
    joined_at: nowIso,
  };

  if (!isUpstashConfigured()) {
    localDb.pairs.set(pairId, pair);
    localDb.members.set(pairId, [member]);
    localDb.invites.set(code, pairId);
    localDb.userPair.set(userId, pairId);
    return pair;
  }

  const redis = getRedisClient();
  await redis.hset(`pairs:${pairId}`, {
    id: pair.id,
    invitation_code: pair.invitation_code,
    status: pair.status,
    finish_threshold: String(pair.finish_threshold),
    cooldown_seconds: String(pair.cooldown_seconds),
    custom_ranks: '',
    group_chat_id: pair.group_chat_id || '',
    last_animation_file: '',
    recent_scenes: JSON.stringify([]),
    round_started_at: pair.round_started_at,
    created_at: pair.created_at,
  });

  await redis.rpush(`pair_members:${pairId}`, JSON.stringify(member));
  await redis.set(`invitation:${code}`, pairId);
  await redis.set(`user_pair:${userId}`, pairId);

  return pair;
}

export async function joinPairByCode(
  userId: string,
  code: string,
  groupChatId?: string | null
): Promise<Pair> {
  const existingPairId = await getUserPairId(userId);
  if (existingPairId) {
    throw new Error('Ты уже состоишь в игровой паре.');
  }

  const normalized = code.trim().toUpperCase();
  let pairId: string | null = null;

  if (!isUpstashConfigured()) {
    pairId = localDb.invites.get(normalized) || null;
  } else {
    const redis = getRedisClient();
    pairId = await redis.get<string>(`invitation:${normalized}`);
  }

  if (!pairId) {
    throw new Error('Пара с таким кодом приглашения не найдена.');
  }

  const pair = await getPairById(pairId);
  if (!pair) {
    throw new Error('Пара не найдена.');
  }

  const members = await getPairMembers(pairId);
  if (pair.status !== 'waiting' || members.length >= 2) {
    throw new Error('В этой паре уже двое участников.');
  }

  const nowIso = new Date().toISOString();
  const member: PairMember = {
    id: crypto.randomUUID(),
    pair_id: pairId,
    user_id: userId,
    lane_index: 1,
    joined_at: nowIso,
  };

  pair.status = 'active';
  if (groupChatId && !pair.group_chat_id) {
    pair.group_chat_id = groupChatId;
  }

  if (!isUpstashConfigured()) {
    members.push(member);
    localDb.members.set(pairId, members);
    localDb.pairs.set(pairId, pair);
    localDb.userPair.set(userId, pairId);
    return pair;
  }

  const redis = getRedisClient();
  await redis.rpush(`pair_members:${pairId}`, JSON.stringify(member));
  await redis.hset(`pairs:${pairId}`, {
    status: 'active',
    ...(pair.group_chat_id ? { group_chat_id: pair.group_chat_id } : {}),
  });
  await redis.set(`user_pair:${userId}`, pairId);

  return pair;
}

export async function bindGroupChat(pairId: string, groupChatId: string | null): Promise<void> {
  if (!isUpstashConfigured()) {
    const p = localDb.pairs.get(pairId);
    if (p) p.group_chat_id = groupChatId;
    return;
  }
  const redis = getRedisClient();
  await redis.hset(`pairs:${pairId}`, { group_chat_id: groupChatId || '' });
}

export async function recordPlayedScene(pairId: string, sceneId: string): Promise<void> {
  const pair = await getPairById(pairId);
  if (!pair) return;

  const current = Array.isArray(pair.recent_scenes) ? pair.recent_scenes : [];
  const next = [sceneId, ...current.filter((id: string) => id !== sceneId)].slice(0, 10);
  pair.recent_scenes = next;
  pair.last_animation_file = sceneId;

  if (!isUpstashConfigured()) {
    localDb.pairs.set(pairId, pair);
    return;
  }

  const redis = getRedisClient();
  await redis.hset(`pairs:${pairId}`, {
    last_animation_file: sceneId,
    recent_scenes: JSON.stringify(next),
  });
}

export async function updateSettings(params: {
  userId: string;
  pairId: string;
  finishThreshold?: number;
  cooldownSeconds?: number;
  notificationEnabled?: boolean;
  roundStartedAt?: string;
}): Promise<void> {
  const pair = await getPairById(params.pairId);
  if (pair) {
    const pairPatch: Record<string, unknown> = {};
    if (params.finishThreshold !== undefined) {
      pair.finish_threshold = Math.max(3, Math.min(50, Math.round(params.finishThreshold)));
      pairPatch.finish_threshold = String(pair.finish_threshold);
    }
    if (params.cooldownSeconds !== undefined) {
      pair.cooldown_seconds = Math.max(0, Math.min(600, Math.round(params.cooldownSeconds)));
      pairPatch.cooldown_seconds = String(pair.cooldown_seconds);
    }
    if (params.roundStartedAt !== undefined) {
      pair.round_started_at = params.roundStartedAt;
      pairPatch.round_started_at = pair.round_started_at;
    }

    if (!isUpstashConfigured()) {
      localDb.pairs.set(params.pairId, pair);
    } else if (Object.keys(pairPatch).length > 0) {
      const redis = getRedisClient();
      await redis.hset(`pairs:${params.pairId}`, pairPatch);
    }
  }

  if (params.notificationEnabled !== undefined) {
    const conn = await getBotConnectionByUserId(params.userId);
    if (conn) {
      if (!isUpstashConfigured()) {
        conn.notification_enabled = params.notificationEnabled;
      } else {
        const redis = getRedisClient();
        await redis.hset(`bot_connection:${params.userId}`, {
          notification_enabled: String(params.notificationEnabled),
        });
      }
    }
  }
}
