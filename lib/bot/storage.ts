import crypto from 'node:crypto';
import type { Pair, PairMember } from '../../src/types/game.js';
import { getRedisClient, hgetallHash, isUpstashConfigured } from './redis.js';
import { getBotConnectionByUserId, setNotificationEnabled } from './users.js';
import { normalizeInviteCode } from './inviteCode.js';

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
    const p = localDb.pairs.get(pairId) || null;
    if (p && !p.web_token) {
      p.web_token = crypto.randomBytes(12).toString('hex');
    }
    return p;
  }
  const redis = getRedisClient();
  const raw = await hgetallHash(redis, `pairs:${pairId}`);
  if (!raw || !raw.id) return null;
  let webToken = raw.web_token || '';
  if (!webToken) {
    webToken = crypto.randomBytes(12).toString('hex');
    await redis.hset(`pairs:${pairId}`, { web_token: webToken });
  }
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
    fast_animation: raw.fast_animation === 'true',
    web_token: webToken,
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
  const webToken = crypto.randomBytes(12).toString('hex');
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
    fast_animation: false,
    web_token: webToken,
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
    round_started_at: pair.round_started_at || nowIso,
    fast_animation: 'false',
    web_token: webToken,
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
  const normalized = normalizeInviteCode(code);
  let pairId: string | null = null;

  if (!isUpstashConfigured()) {
    pairId = localDb.invites.get(normalized) || null;
  } else {
    const redis = getRedisClient();
    pairId = await redis.get<string>(`invitation:${normalized}`);
  }

  if (!pairId) {
    throw new Error(
      `Код «${normalized || code.trim()}» не найден. Проверь, что он скопирован полностью (формат ALLO-XXXX) и написан латинскими буквами.`
    );
  }

  const pair = await getPairById(pairId);
  if (!pair) {
    await removeInvitation(normalized);
    throw new Error(
      `Приглашение ${normalized} устарело: эта пара уже не существует. Попроси друга создать новый код и отправь его сюда.`
    );
  }

  const members = await getPairMembers(pairId);
  if (pair.status !== 'waiting' || members.length >= 2) {
    throw new Error('В этой паре уже двое участников.');
  }

  const existingPairId = await getUserPairId(userId);
  if (existingPairId) {
    if (existingPairId === pairId) {
      throw new Error('Это твой собственный код приглашения. Отправь его другу — пусть он введёт его со своего аккаунта.');
    }
    const existingPair = await getPairById(existingPairId);
    const existingMembers = existingPair ? await getPairMembers(existingPairId) : [];
    const isSoloWaiting = !existingPair || (existingPair.status === 'waiting' && existingMembers.length <= 1);
    if (!isSoloWaiting) {
      throw new Error('Ты уже состоишь в игровой паре.');
    }
    await abandonSoloPair(userId, existingPairId, existingPair?.invitation_code || null);
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

async function removeInvitation(code: string): Promise<void> {
  if (!code) return;
  if (!isUpstashConfigured()) {
    localDb.invites.delete(code);
    return;
  }
  await getRedisClient().del(`invitation:${code}`);
}

async function abandonSoloPair(userId: string, pairId: string, invitationCode: string | null): Promise<void> {
  if (!isUpstashConfigured()) {
    localDb.pairs.delete(pairId);
    localDb.members.delete(pairId);
    if (invitationCode) localDb.invites.delete(invitationCode);
    localDb.userPair.delete(userId);
    return;
  }
  const redis = getRedisClient();
  await redis.del(`pairs:${pairId}`);
  await redis.del(`pair_members:${pairId}`);
  if (invitationCode) await redis.del(`invitation:${invitationCode}`);
  await redis.del(`user_pair:${userId}`);
}

export async function leavePair(userId: string): Promise<{
  left: boolean;
  pair: Pair | null;
  partnerUserIds: string[];
}> {
  const pairId = await getUserPairId(userId);
  if (!pairId) {
    return { left: false, pair: null, partnerUserIds: [] };
  }

  const [pair, members] = await Promise.all([getPairById(pairId), getPairMembers(pairId)]);
  const memberIds = Array.from(new Set([userId, ...members.map((m) => m.user_id)]));
  const partnerUserIds = members.map((m) => m.user_id).filter((id) => id !== userId);

  if (!isUpstashConfigured()) {
    localDb.pairs.delete(pairId);
    localDb.members.delete(pairId);
    if (pair?.invitation_code) {
      localDb.invites.delete(pair.invitation_code);
    }
    for (const uid of memberIds) {
      localDb.userPair.delete(uid);
    }
    return { left: true, pair, partnerUserIds };
  }

  const redis = getRedisClient();
  await Promise.all([
    redis.del(`pairs:${pairId}`),
    redis.del(`pair_members:${pairId}`),
    ...(pair?.invitation_code ? [redis.del(`invitation:${pair.invitation_code}`)] : []),
    ...memberIds.map((uid) => redis.del(`user_pair:${uid}`)),
  ]);

  return { left: true, pair, partnerUserIds };
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
  fastAnimation?: boolean;
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
    if (params.fastAnimation !== undefined) {
      pair.fast_animation = params.fastAnimation;
      pairPatch.fast_animation = String(params.fastAnimation);
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
      await setNotificationEnabled(params.userId, params.notificationEnabled);
    }
  }
}
