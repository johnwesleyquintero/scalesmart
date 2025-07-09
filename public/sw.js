const CACHE_NAME = 'scalesmart-platform-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  // We will cache other assets dynamically
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For API calls, use a network-first strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If the network request is successful and it's a GET request, cache it
          if (request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If the network fails, try to get it from the cache (only for GET requests)
          if (request.method === 'GET') {
            return caches.match(request);
          }
          // For non-GET requests, if network fails, there's no cache fallback
          return new Response(null, {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }),
    );
    return;
  }

  // For other requests (assets, pages), use a cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Only cache successful GET requests
        if (
          request.method === 'GET' &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      });
    }),
  );
});
