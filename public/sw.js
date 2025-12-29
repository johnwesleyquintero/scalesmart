const CACHE_NAME = 'wesai-portfolio-cache-v2';
const STATIC_CACHE = 'wesai-static-v1';
const IMAGE_CACHE = 'wesai-images-v1';
const API_CACHE = 'wesai-api-v1';

const PRECACHE_URLS = [
  '/',
  '/site.webmanifest',
  '/favicon.svg',
  '/logo.svg',
  '/cover.svg',
  '/profile/profile-photo.JPG',
  '/images/github-mark.svg',
];

// Install Event: Pre-cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Pre-caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const cacheAllowlist = [CACHE_NAME, STATIC_CACHE, IMAGE_CACHE, API_CACHE];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheAllowlist.includes(cacheName)) {
              console.log('Service Worker: Clearing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Helper: Determine if request is an image
const isImageRequest = (request) => {
  return (
    request.destination === 'image' ||
    request.url.match(/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/) ||
    request.url.includes('/images/')
  );
};

// Helper: Determine if request is a static asset (js, css, font)
const isStaticAsset = (request) => {
  return (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.url.match(/\.(?:js|css|woff2|woff|ttf|otf)$/)
  );
};

// Fetch Event: Optimized strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http/https requests (e.g., chrome-extension)
  if (!url.protocol.startsWith('http')) return;

  // 1. API Strategy: Network First
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return new Response(
              JSON.stringify({ error: 'Offline - cached data unavailable' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          });
        }),
    );
    return;
  }

  // 2. Image Strategy: Cache First, then Network (with dynamic caching)
  if (isImageRequest(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }),
    );
    return;
  }

  // 3. Static Assets & Pages: Stale While Revalidate
  // This ensures fast loads while keeping the app updated in the background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok && request.method === 'GET') {
            const responseClone = networkResponse.clone();
            const targetCache = isStaticAsset(request)
              ? STATIC_CACHE
              : CACHE_NAME;
            caches.open(targetCache).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback if network fails and no cache
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });

      return cachedResponse || fetchPromise;
    }),
  );
});
