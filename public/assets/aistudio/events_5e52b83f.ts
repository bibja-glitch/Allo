import crypto from 'node:crypto';
import type { CallEvent, EventStatus } from '../../src/types/game.js';
import { getRedisClient, hgetallHash, isUpstashConfigured, toHash } from './redis.js';

const WEBHOOK_DEDUP_TTL_SECONDS = 24 * 60 * 60;
const PENDING_ANIMATIONS_KEY = 'pending_animations';
/** Сколько последних событий пары читать за один запрос (защита от роста числа команд Redis). */
const MAX_EVENTS_LOADED = 500;

interface LocalEventsDb {
  events: CallEvent[];
  processedUpdates: number[];
}
const localEvents: LocalEventsDb = {
  events: [],
  processedUpdates: [],
};

export async function claimWebhookUpdate(updateId: number): Promise<boolean> {
  if (!isUpstashConfigured()) {
    if (localEvents.processedUpdates.includes(updateId)) return false;
    localEvents.processedUpdates.push(updateId);
    if (localEvents.processedUpdates.length > 1000) {
      localEvents.processedUpdates = localEvents.processedUpdates.slice(-500);
    }
    return true;
  }

  const redis = getRedisClient();
  // NX + TTL: ключи дедупликации не копятся вечно (Telegram повторяет апдейты максимум несколько часов)
  const res = await redis.set(`webhook_update:${updateId}`, '1', { nx: true, ex: WEBHOOK_DEDUP_TTL_SECONDS });
  return res === 'OK';
}

/** Снимает метку «апдейт обработан», чтобы повтор от Telegram после ошибки не был отброшен как дубликат. */
export async function releaseWebhookUpdate(updateId: number): Promise<void> {
  if (!isUpstashConfigured()) {
    localEvents.processedUpdates = localEvents.processedUpdates.filter((id) => id !== updateId);
    return;
  }
  const redis = getRedisClient();
  await redis.del(`webhook_update:${updateId}`);
}

export async function createMissedCallEvent(ev: Omit<CallEvent, 'id'>): Promise<CallEvent> {
  const existing = await getEventByIdempotencyKey(ev.pair_id, ev.idempotency_key);
  if (existing) return existing;

  const eventId = crypto.randomUUID();
  const created: CallEvent = { ...ev, id: eventId };

  if (!isUpstashConfigured()) {
    localEvents.events.unshift(created);
    return created;
  }

  const redis = getRedisClient();
  await redis.hset(`event:${eventId}`, {
    id: created.id,
    pair_id: created.pair_id,
    actor_id: created.actor_id,
    recipient_id: created.recipient_id,
    event_type: created.event_type,
    status: created.status,
    steps_awarded: String(created.steps_awarded),
    note: created.note || '',
    target_chat_id: created.target_chat_id || '',
    scene_id: created.scene_id || '',
    animation_file: created.animation_file || '',
    animation_message_id: created.animation_message_id || '',
    animation_expires_at: created.animation_expires_at || '',
    animation_deleted_at: created.animation_deleted_at || '',
    result_message_id: created.result_message_id || '',
    created_at: created.created_at,
    resolved_at: created.resolved_at || '',
    idempotency_key: created.idempotency_key,
  });

  await redis.rpush(`events:${ev.pair_id}`, eventId);
  await redis.set(`idempotency:${ev.pair_id}:${ev.idempotency_key}`, eventId);

  return created;
}

export async function getEventById(eventId: string): Promise<CallEvent | null> {
  if (!isUpstashConfigured()) {
    return localEvents.events.find((e) => e.id === eventId) || null;
  }

  const redis = getRedisClient();
  const raw = await hgetallHash(redis, `event:${eventId}`);
  if (!raw || !raw.id) return null;

  return parseCallEventHash(raw);
}

export async function getEventByIdempotencyKey(
  pairId: string,
  idempotencyKey: string
): Promise<CallEvent | null> {
  if (!isUpstashConfigured()) {
    return localEvents.events.find((e) => e.pair_id === pairId && e.idempotency_key === idempotencyKey) || null;
  }

  const redis = getRedisClient();
  const eventId = await redis.get<string>(`idempotency:${pairId}:${idempotencyKey}`);
  if (!eventId) return null;
  return await getEventById(eventId);
}

export async function getEventsForPair(pairId: string): Promise<CallEvent[]> {
  if (!isUpstashConfigured()) {
    return localEvents.events
      .filter((e) => e.pair_id === pairId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const redis = getRedisClient();
  const eventIds = await redis.lrange<string>(`events:${pairId}`, -MAX_EVENTS_LOADED, -1);
  if (!eventIds || eventIds.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of eventIds) {
    pipeline.hgetall(`event:${id}`);
  }
  const results = ((await pipeline.exec()) as unknown[]).map((r) => toHash(r));
  const events: CallEvent[] = [];
  for (const raw of results) {
    if (raw && raw.id) {
      events.push(parseCallEventHash(raw));
    }
  }

  return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function updateEventLifecycle(
  eventId: string,
  patch: Partial<{
    status: EventStatus;
    resolved_at: string | null;
    target_chat_id: string | null;
    scene_id: string | null;
    animation_file: string | null;
    animation_message_id: string | null;
    animation_expires_at: string | null;
    animation_deleted_at: string | null;
    result_message_id: string | null;
  }>
): Promise<CallEvent> {
  if (!isUpstashConfigured()) {
    const ev = localEvents.events.find((e) => e.id === eventId);
    if (!ev) throw new Error('Event not found');
    Object.assign(ev, patch);
    return ev;
  }

  const redis = getRedisClient();
  const patchMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) {
      patchMap[k] = v === null ? '' : String(v);
    }
  }

  await redis.hset(`event:${eventId}`, patchMap);

  // Индекс незавершённых анимаций для cron-очистки: score = время истечения (мс)
  if (typeof patch.animation_expires_at === 'string' && !patch.animation_deleted_at) {
    const expiresMs = new Date(patch.animation_expires_at).getTime();
    if (Number.isFinite(expiresMs)) {
      await redis.zadd(PENDING_ANIMATIONS_KEY, { score: expiresMs, member: eventId });
    }
  }
  if (patch.animation_deleted_at) {
    await redis.zrem(PENDING_ANIMATIONS_KEY, eventId);
  }

  const updated = await getEventById(eventId);
  if (!updated) throw new Error('Event not found after update');
  return updated;
}

export async function findExpiredPendingAnimations(_nowIso = new Date().toISOString()): Promise<CallEvent[]> {
  if (!isUpstashConfigured()) {
    const nowMs = new Date(_nowIso).getTime();
    return localEvents.events.filter(
      (e) =>
        e.animation_message_id &&
        !e.animation_deleted_at &&
        e.animation_expires_at &&
        new Date(e.animation_expires_at).getTime() <= nowMs
    );
  }

  const redis = getRedisClient();
  const nowMs = new Date(_nowIso).getTime();
  const ids = await redis.zrange<string[]>(PENDING_ANIMATIONS_KEY, 0, nowMs, { byScore: true });
  const result: CallEvent[] = [];
  for (const id of ids || []) {
    const ev = await getEventById(String(id));
    if (!ev || ev.animation_deleted_at || !ev.animation_message_id) {
      await redis.zrem(PENDING_ANIMATIONS_KEY, String(id));
      continue;
    }
    result.push(ev);
  }
  return result;
}

function parseCallEventHash(raw: Record<string, string>): CallEvent {
  return {
    id: raw.id,
    pair_id: raw.pair_id,
    actor_id: raw.actor_id,
    recipient_id: raw.recipient_id,
    event_type: (raw.event_type as CallEvent['event_type']) || 'missed_call',
    status: (raw.status as EventStatus) || 'pending',
    steps_awarded: Number(raw.steps_awarded || 1),
    note: raw.note || null,
    target_chat_id: raw.target_chat_id || null,
    scene_id: raw.scene_id || null,
    animation_file: raw.animation_file || null,
    animation_message_id: raw.animation_message_id || null,
    animation_expires_at: raw.animation_expires_at || null,
    animation_deleted_at: raw.animation_deleted_at || null,
    result_message_id: raw.result_message_id || null,
    created_at: raw.created_at || new Date().toISOString(),
    resolved_at: raw.resolved_at || null,
    idempotency_key: raw.idempotency_key || '',
  };
}
