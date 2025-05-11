import Redis from 'ioredis';

const redisUrl = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_URL ||
  ''
).replace('rediss://', 'https://');

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

export const redis = new Redis(redisUrl, {
  password: redisToken,
});

export const rateLimiter = {
  limit: async (identifier: string) => {
    const current = await redis.incr(identifier);
    const maxRequests = 10;
    const window = 60;

    if (current > maxRequests) {
      return { success: false };
    }

    await redis.expire(identifier, window);
    return { success: true };
  },
};
