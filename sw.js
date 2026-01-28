const CACHE_NAME = 'word-guess-v3';
const URLS_TO_CACHE = [
  '/Random-Guess/',
  '/Random-Guess/index.html',
  '/Random-Guess/manifest.json',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2|woff|ttf)$/i);

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses or error types
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Only cache HTML and non-versioned assets
        if (!isAsset || event.request.url.includes('/assets/')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Return a fallback response if offline
        return caches.match('/Random-Guess/index.html');
      });
    })
  );
});
