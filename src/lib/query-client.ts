import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes
const CACHE_TIME = 1000 * 60 * 60; // 1 hour

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      cacheTime: CACHE_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

// Use React cache to ensure consistent instances across renders
export const getQueryClient = cache(() => new QueryClient(queryClientConfig));
