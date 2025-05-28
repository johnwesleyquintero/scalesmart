import { NextResponse } from 'next/server';
import { createClient, RedisClientType } from 'redis';
import { handleApiError, createErrorResponse } from '@/lib/api-error-handler';

let redisClient: RedisClientType;

export async function initializeRedis() {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('Redis URL not configured');
    }

    console.log('REDIS_URL:', process.env.REDIS_URL);
    redisClient = createClient({
      url: process.env.REDIS_URL,
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
    console.error('Failed to connect to Redis:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}

export async function GET() {
  try {
    if (!redisClient) {
      await initializeRedis();
    }

    const value = await redisClient.get('myKey');
    return NextResponse.json({ value });
  } catch (error) {
    console.error('Redis operation failed:', error);
    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
