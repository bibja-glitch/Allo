import { Redis } from '@upstash/redis';

export function isUpstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return Boolean(url && url.startsWith('http') && token && token.length > 5);
}

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

    if (!url || !token) {
      throw new Error(
        'Upstash Redis is not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment variables.'
      );
    }

    redisClient = new Redis({
      url,
      token,
      automaticDeserialization: false,
    });
  }
  return redisClient;
}

export function toHash(value: unknown): Record<string, string> | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    const obj: Record<string, string> = {};
    for (let i = 0; i + 1 < value.length; i += 2) {
      obj[String(value[i])] = String(value[i + 1]);
    }
    return obj;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    const obj: Record<string, string> = {};
    for (const [k, v] of entries) {
      obj[k] =
        typeof v === 'string'
          ? v
          : v === null || v === undefined
            ? ''
            : typeof v === 'object'
              ? JSON.stringify(v)
              : String(v);
    }
    return obj;
  }
  return null;
}

export async function hgetallHash(redis: Redis, key: string): Promise<Record<string, string> | null> {
  return toHash(await redis.hgetall(key));
}
