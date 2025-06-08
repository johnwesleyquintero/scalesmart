import { getItem, setItem } from './indexeddb-service';

import { Course } from '@/types';

interface CachedResponse {
  url: string;
  data: Course[];
  expiry: number;
}

interface RequestInit {
  method?: string;
  headers?: { [key: string]: string };
  body?: string;
  mode?: 'cors' | 'no-cors' | 'same-origin';
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?: 'default' | 'no-store' | 'reload' | 'force-cache' | 'only-if-cached';
  redirect?: 'follow' | 'error' | 'manual';
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal | null;
  window?: null;
  duplex?: 'half' | 'full';
}

async function cachedFetch(
  url: string,
  options?: RequestInit,
  ttl: number = 3600, // Default TTL of 1 hour
): Promise<Response> {
  try {
    console.time(`Load ${url} from cache`);
    const cachedResponse = await getItem<CachedResponse>('apiCache', url);
    console.timeEnd(`Load ${url} from cache`);
    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      console.log(`Returning cached response for ${url}`);
      return new Response(JSON.stringify(cachedResponse.data), {
        headers: { 'content-type': 'application/json' },
      });
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseClone = response.clone(); // Clone the response
    const data = await responseClone.json(); // Read the body from the clone
    const expiry = Date.now() + ttl * 1000; // Calculate expiry time
    console.time(`Save ${url} to cache`);
    await setItem('apiCache', url, { url: url, data: data, expiry: expiry });
    console.timeEnd(`Save ${url} to cache`);
    console.log(`Caching response for ${url}`);
    return response; // Return the original response
  } catch (error) {
    console.error(`Error fetching or caching ${url}:`, error);
    throw error;
  }
}

export { cachedFetch };

// Rollback strategy: To revert to the previous version, simply remove the IndexedDB code
// and the console.time statements.
