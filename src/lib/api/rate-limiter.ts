import Redis from 'ioredis';

const redisUrl = (
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_URL ||
  ''
).replace('rediss://', 'https://');

const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

console.log('Redis URL:', redisUrl);
console.log('Redis Token:', redisToken);

let redis: Redis;
try {
  redis = new Redis(redisUrl, {
    password: redisToken,
  });

  redis.on('connect', () => {
    console.log('Redis connected successfully (rate-limiter)');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error (rate-limiter):', err);
  });
} catch (error) {
  console.error('Error creating Redis client (rate-limiter):', error);
  throw error; // Re-throw to prevent the app from running without a Redis connection
}

export { redis };

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
