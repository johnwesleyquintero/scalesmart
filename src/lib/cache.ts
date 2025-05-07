// src/lib/cache.ts
import { Redis } from '@upstash/redis';

// Redis-based cache implementation
class RedisCache {
  private redis: Redis;
  private pruningInterval: number;

  constructor() {
    // Initialize Redis client using configuration
    this.redis = new Redis(getRedisConfig());

    // Set pruning interval from environment variable, default to 60 seconds
    this.pruningInterval = parseInt(
      process.env.CACHE_PRUNING_INTERVAL || '60000',
      10,
    );

    // Start the pruning interval
    this.startPruning();
  }

  // Retrieves a value from the cache by key. Returns null if not found or expired.
  async get(key: string): Promise<unknown | null> {
    try {
      console.log(`[Cache] Getting from Redis: ${key}`);
      const data = (await this.redis.get(key)) as unknown;
      if (data !== null) {
        console.log(`[Cache] Found in Redis: ${key}`);
      } else {
        console.log(`[Cache] Not found in Redis: ${key}`);
      }
      return data;
    } catch (error) {
      console.error(`[Cache] Error getting from Redis: ${key}`, error);
      return null; // Fallback: Return null if Redis fails
    }
  }

  // Sets a value in the cache with an optional time-to-live (TTL) in milliseconds.
  async set(
    key: string,
    data: unknown,
    ttl?: number,
    tags?: string[],
  ): Promise<void> {
    try {
      console.log(`[Cache] Setting to Redis: ${key}`);
      if (ttl) {
        await this.redis.set(key, data, { px: ttl }); // Use px for milliseconds
      } else {
        await this.redis.set(key, data);
      }
      if (tags && tags.length > 0) {
        const tagKey = `tags:${key}`;
        await this.redis.sadd(tagKey, ...tags);
      }
      console.log(`[Cache] Set in Redis: ${key}`);
    } catch (error) {
      console.error(`[Cache] Error setting to Redis: ${key}`, error);
      // Fallback:  Do nothing if Redis fails
    }
  }

  // Deletes a value from the cache by key.
  async delete(key: string): Promise<void> {
    try {
      console.log(`[Cache] Deleting from Redis: ${key}`);
      await this.redis.del(key);
      console.log(`[Cache] Deleted from Redis: ${key}`);
    } catch (error) {
      console.error(`[Cache] Error deleting from Redis: ${key}`, error);
      // Fallback: Do nothing if Redis fails
    }
  }

  // Clears all entries from the cache.  This is a potentially dangerous operation.
  async clear(): Promise<void> {
    // WARNING: This will clear the entire Redis database.  Use with extreme caution.

    try {
      console.log('[Cache] Clearing Redis cache');
      await this.redis.flushdb();
      console.log('[Cache] Cleared Redis cache');
    } catch (error) {
      console.error('Error clearing Redis cache', error);
      // Fallback: Do nothing if Redis fails
    }
  }

  // Invalidates a specific cache entry by key.
  async invalidate(key: string): Promise<void> {
    // await this.delete(key); // Old implementation
    await this.invalidateByTag(key); // New implementation
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tags:${tag}`;
      const keys = (await this.redis.smembers(tagKey)) as string[];
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.delete(key);
        }
      }
    } catch (error) {
      console.error(`[Cache] Error invalidating cache by tag: ${tag}`, error);
      // Fallback: Do nothing if Redis fails
    }
  }

  // Starts the cache pruning interval.
  private startPruning(): void {
    setInterval(async () => {
      try {
        // Implement cache pruning logic here.  This is a placeholder.
        // You might need to iterate through keys and check for expiration.
        console.log('Running cache pruning...');
        // Example:  await this.redis.scan(0, { MATCH: '*', COUNT: 100 }).then(async ([, keys]) => {
        //   if (keys && keys.length > 0) {
        //     for (const key of keys) {
        //       const ttl = await this.redis.ttl(key);
        //       if (ttl !== -1 && ttl <= 0) { // Expired
        //         await this.delete(key);
        //         console.log(`Pruned expired key: ${key}`);
        //       }
        //     }
        //   }
        // });
      } catch (error) {
        console.error('Error during cache pruning:', error);
      }
    }, this.pruningInterval);
  }
}

export const cache = new RedisCache();
function getRedisConfig(): { url: string; token: string } {
  return {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    token: process.env.REDIS_TOKEN || ''
  };
}
