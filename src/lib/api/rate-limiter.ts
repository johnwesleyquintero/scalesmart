import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL;

interface RateLimiterRedis {
  incr: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<void>; // expire returns void in node-redis client if successful, but original was Promise<number>, will adapt for compatibilty.
}

let redis: RateLimiterRedis;

if (redisUrl) {
  try {
    const nodeRedisClient = createClient({
      url: redisUrl,
    });

    nodeRedisClient.on('error', (err) =>
      console.error('Redis Client Error', err),
    );

    // Connect to Redis only once
    (async () => {
      try {
        await nodeRedisClient.connect();
        console.log(
          'Redis client initialized and connected for rate limiting.',
        );
      } catch (err) {
        console.error('Error connecting to Redis:', err);
        // Fallback to a no-op Redis client if connection fails
        redis = {
          incr: async () => 1,
          expire: async () => {}, // Use empty async function for no-op expire
        };
      }
    })();

    // Ensure the Redis instance has the expected methods
    redis = {
      incr: async (key: string) => {
        const result = await nodeRedisClient.incr(key);
        return typeof result === 'number' ? result : 1; // Ensure number is returned
      },
      expire: async (key: string, ttl: number) => {
        await nodeRedisClient.expire(key, ttl);
      },
    };
  } catch (error) {
    console.error('Error initializing Node Redis client:', error);
    // Fallback to a no-op Redis client if initialization fails
    redis = {
      incr: async () => 1,
      expire: async () => {},
    };
  }
} else {
  console.warn(
    'Missing Redis URL. Rate limiting will be skipped. Ensure REDIS_URL is set if you need rate limiting.',
  );
  // Mock Redis client for development when environment variables are not set
  redis = {
    incr: async () => 1,
    expire: async () => {},
  };
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
