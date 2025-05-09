declare module '@upstash/redis' {
  interface Redis {
    constructor(options: { url: string; token: string });
    hincrby(key: string, field: string, increment: number): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    eval(script: string, keys: string[], args: string[]): Promise<unknown>;
  }
  const Redis: {
    new (options: { url: string; token: string }): Redis;
  };
  export { Redis };
}
