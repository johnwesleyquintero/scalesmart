import { createClient, RedisClientType } from 'redis';
import {
  isRedisConfigured,
  getRedisConfig,
  createMockRedisClient,
} from '@/lib/redis-config';

const redisUrl = process.env.REDIS_URL;

interface RateLimiterRedis {
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<void>;
}

// Declare a global variable to store the Redis client
declare global {
  var redisClient: ReturnType<typeof createClient> | undefined;
  var rateLimiterRedis: RateLimiterRedis | undefined;
}

// Initialize redis to a no-op client immediately to ensure it's always defined
let redis: RateLimiterRedis = {
  incr: async () => 1,
  expire: async () => {},
};

if (redisUrl && isRedisConfigured()) {
  // Use globalThis to ensure a single Redis client instance across hot reloads
  if (!globalThis.redisClient) {
    try {
      const redisConfig = getRedisConfig();
      if (!redisConfig) {
        console.warn('Redis configuration invalid - using no-op client');
        redis = {
          incr: async () => 1,
          expire: async () => {},
        };
      } else {
        const nodeRedisClient = createClient(redisConfig);

        nodeRedisClient.on('error', (err) =>
          console.error('Redis Client Error', err),
        );

        const connectWithRetry = async (
          client: ReturnType<typeof createClient>,
          retries = 3, // Reduced retries for faster build process
          delay = 1000,
        ) => {
          for (let i = 0; i < retries; i++) {
            try {
              await client.connect();
              console.log(
                'Redis client initialized and connected for rate limiting.',
              );
              return true;
            } catch (err) {
              console.error(
                `Error connecting to Redis (attempt ${i + 1}/${retries}):`,
                err,
              );
              if (i < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
              }
            }
          }
          return false;
        };

        (async () => {
          const connected = await connectWithRetry(nodeRedisClient);
          if (connected) {
            globalThis.redisClient = nodeRedisClient;
            globalThis.rateLimiterRedis = {
              incr: async (key: string) => {
                const result = await nodeRedisClient.incr(key);
                return typeof result === 'number' ? result : 1;
              },
              expire: async (key: string, ttl: number) => {
                await nodeRedisClient.expire(key, ttl);
              },
            };
            redis = globalThis.rateLimiterRedis; // Assign the globally managed client
          } else {
            console.warn(
              'Falling back to no-op Redis client for rate limiting due to persistent connection errors.',
            );
          }
        })();
      }
    } catch (error) {
      console.error('Error initializing Node Redis client:', error);
      // During build process, use no-op client instead of failing
      if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
        console.warn('Using no-op Redis client for build process');
      }
    }
  } else {
    // If client already exists, use the existing global instance
    console.log('Using existing Redis client for rate limiting.');
    redis = globalThis.rateLimiterRedis!;
  }
} else {
  console.warn(
    'Missing Redis URL. Rate limiting will be skipped. Ensure REDIS_URL is set if you need rate limiting.',
  );
}

export { redis };

export const rateLimiter = {
  limit: async (identifier: string) => {
    // Only apply rate limiting if Redis is properly configured
    // and an actual client is available (not the no-op fallback immediately after error)
    if (redisUrl && redis && redis.incr && redis.expire) {
      const current = await redis.incr(identifier);
      const maxRequests = 10;
      const window = 60;

      if (current > maxRequests) {
        return {
          success: false,
          limit: maxRequests,
          remaining: maxRequests - current,
        };
      }

      await redis.expire(identifier, window);
      return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - current,
      };
    } else {
      // If Redis is not configured or an error occurred during setup, always allow the request
      return { success: true, limit: 0, remaining: 0 };
    }
  },
};
