import { Redis } from 'ioredis';
import { config } from './config.js';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const cacheKeys = {
  feedLatest: 'feed:latest',
  adminStats: 'admin:stats',
  session: (tokenId: string) => `session:${tokenId}`,
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await redis.del(...keys);
}
