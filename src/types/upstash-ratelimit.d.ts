declare module '@upstash/ratelimit' {
  interface Redis {
    hincrby: (key: string, field: string, value: number) => Promise<number>;
    expire: (key: string, seconds: number) => Promise<number>;
    eval: <T>(script: string, keys: string[], args: string[]) => Promise<T>;
  }

  interface SlidingWindowOptions {
    requests: number;
    window: string;
  }

  export class Ratelimit {
    constructor(options: {
      redis: Redis;
      limiter: {
        slidingWindow: (
          requests: number,
          window: string,
        ) => SlidingWindowOptions;
      };
      analytics?: boolean;
      prefix?: string;
    });
  }
}

import { RedisCommands } from '@upstash/redis';
declare module '@upstash/redis' {
  export interface Redis extends RedisCommands {}
}
