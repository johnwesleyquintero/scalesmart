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

  interface Ratelimit {
    limit: (identifier: string) => Promise<{ success: boolean }>;
  }

  export class Ratelimit {
    static slidingWindow(
      arg0: number,
      arg1: string,
    ): {
      slidingWindow: (requests: number, window: string) => SlidingWindowOptions;
    } {
      throw new Error('Method not implemented.');
    }
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

declare module '@upstash/redis' {
  export interface Redis extends RedisCommands {}
}
