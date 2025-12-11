// Redis configuration for build-time optimization
export const isRedisConfigured = () => {
  return !!process.env.REDIS_URL && process.env.REDIS_URL !== '';
};

export const getRedisConfig = () => {
  if (!isRedisConfigured()) {
    return null;
  }

  return {
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries: number) => {
        if (retries > 3) return false;
        return Math.min(retries * 1000, 3000);
      },
    },
  };
};

// Mock Redis client for build process
export const createMockRedisClient = () => ({
  get: async () => null,
  set: async () => {},
  incr: async () => 1,
  expire: async () => {},
  disconnect: async () => {},
  connect: async () => {},
});
