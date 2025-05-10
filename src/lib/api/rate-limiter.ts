import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL || '').replace(
    'rediss://',
    'https://',
  ),
  token:
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
});

const window = 10000; // 10 seconds
const maxRequests = 15;

export async function rateLimiter(
  identifier: string,
): Promise<{ success: boolean; reset: number }> {
  const key = `rateLimit:${identifier}`;
  const now = Date.now();

  const requests = await (redis as any).zrangebyscore(key, now - window, now);
  if (requests.length >= maxRequests) {
    return { success: false, reset: now + window };
  }

  await (redis as any).zadd(key, { score: now, member: now });
  await (redis as any).zremrangebyscore(key, 0, now - window);
  await redis.expire(key, window / 1000);

  return { success: true, reset: now + window };
}

export type RateLimiter = typeof rateLimiter;
