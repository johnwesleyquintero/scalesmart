// Simplified rate limiter without Redis dependency
// Always allows requests since Redis is removed

export const rateLimiter = {
  limit: async (identifier: string) => {
    // Always allow requests - no rate limiting without Redis
    return { success: true, limit: 0, remaining: 0 };
  },
};
