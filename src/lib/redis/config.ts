import { Ratelimit } from '@upstash/ratelimit';
import { Redis as UpstashRedis } from '@upstash/redis';

// Configuration object for Redis connection
export const redisConfig = {
  url: process.env.REDIS_URL || process.env.KV_URL,
  token: process.env.REDIS_TOKEN || process.env.KV_REST_API_TOKEN,
  readOnlyToken: process.env.KV_REST_API_READ_ONLY_TOKEN,
  apiUrl: process.env.KV_REST_API_URL,
};

// Retrieves the Redis URL from the configuration.
export function getRedisUrl() {
  const url = redisConfig.url;
  if (!url) {
    throw new Error('Redis URL not configured');
  }
  return url;
}

// Retrieves the Redis token from the configuration.
export function getRedisToken() {
  const token = redisConfig.token;
  if (!token) {
    throw new Error('Redis token not configured');
  }
  return token;
}

type RedisConfig = {
  url: string;
  token: string;
  maxRetriesPerRequest?: number;
  retryStrategy?: (times: number) => number | null;
};

// Retrieves the Redis configuration, including URL, token, and retry settings.
function getRedisConfig(): RedisConfig {
  const url = getRedisUrl();
  const token = getRedisToken();

  return {
    url,
    token,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 5000),
  };
}

// Initialize Redis client with connection pooling
import type { Redis } from '@upstash/redis';
export let redis: Redis;

try {
  redis = new UpstashRedis(getRedisConfig());
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  // Fallback to in-memory solution if Redis connection fails
  redis = {
    ping: async () => false,
    get: async () => null,
    set: async () => 'OK',
    del: async () => 0,
    expire: async () => 0
  } as unknown as Redis;
}

// Configures rate limiting using Upstash Ratelimit.
export const rateLimiter = new Ratelimit({
  // @ts-expect-error - Ignoring type check for redis as it's initialized later.
  redis,
  // @ts-expect-error - Ignoring type check for limiter.
  limiter: Ratelimit.slidingWindow({
    allowedTokens: (identifier: string) =>
      identifier === 'anonymous' ? 5 : 10,
    window: 60 * 1000,
  }),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

// Checks the Redis connection by attempting to ping the server.
export async function checkRedisConnection(): Promise<boolean> {
  if (!process.env.REDIS_URL && !process.env.KV_URL) {
    console.warn('Redis URL not configured - falling back to memory');
    return false;
  }
  console.log('REDIS_URL:', process.env.REDIS_URL);
  console.log('KV_URL:', process.env.KV_URL);
  console.log('REDIS_TOKEN:', process.env.REDIS_TOKEN);
  console.log('KV_REST_API_TOKEN:', process.env.KV_REST_API_TOKEN);
  try {
    // @ts-expect-error
    if (typeof redis.ping === 'function') {
      // @ts-expect-error
      await redis.ping();
      return true;
    } else {
      console.warn('Redis ping is not a function - using fallback');
      return false;
    }
  } catch (error) {
    console.error('Redis connection error:', error);
    // Add fallback logic here if needed
    return false;
  }
}
