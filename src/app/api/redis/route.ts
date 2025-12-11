import { NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

let redisClient: RedisClientType;

export async function initializeRedis() {
  try {
    if (!process.env.REDIS_URL) {
      console.warn(
        'Redis URL not configured - using mock client for build process',
      );
      // Return mock client for build process
      return {
        get: async (key: string) => null,
        set: async (key: string, value: string) => {},
        disconnect: async () => {},
      };
    }

    console.log('REDIS_URL:', process.env.REDIS_URL);
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000, // 5 second timeout
        reconnectStrategy: (retries) => {
          if (retries > 3) return false; // Stop after 3 retries
          return Math.min(retries * 1000, 3000); // Exponential backoff
        },
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully (api/redis)');
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error (api/redis):', err);
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error(
      'Failed to connect to Redis during build - using fallback:',
      error,
    );
    // Return a mock client for build process instead of throwing
    return {
      get: async (key: string) => null,
      set: async (key: string, value: string) => {},
      disconnect: async () => {},
    };
  }
}

export async function GET() {
  try {
    if (!redisClient) {
      const fallbackClient = await initializeRedis();
      if (fallbackClient && typeof fallbackClient.get === 'function') {
        // Use fallback/mock client during build process
        const value = await fallbackClient.get('myKey');
        return NextResponse.json({ value, source: 'mock' });
      }
    }

    if (redisClient && redisClient.get) {
      const value = await redisClient.get('myKey');
      return NextResponse.json({ value, source: 'redis' });
    }

    // If no Redis client available, return mock data for build process
    return NextResponse.json({
      value: null,
      source: 'none',
      message: 'Redis not configured',
    });
  } catch (error) {
    console.error('Redis operation failed:', error);
    // Return mock data instead of error during build process
    return NextResponse.json({
      value: null,
      source: 'error',
      message: 'Redis operation failed',
    });
  }
}
