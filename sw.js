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

// Fetch event - stale-while-revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const isHtmlRequest = event.request.url.endsWith('.html') || event.request.url.endsWith('/');
  const isAssetRequest = url.pathname.includes('/assets/');

  if (isAssetRequest) {
    // For versioned assets (with hashes), use cache-first strategy
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        })
        .catch(() => {
          // If both cache and network fail, return a generic offline page
          return caches.match('/Random-Guess/index.html');
        })
    );
  } else {
    // For HTML and other requests, use network-first strategy
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            // On bad response, try cache
            return caches.match(event.request).then((cachedResponse) => {
              return cachedResponse || caches.match('/Random-Guess/index.html');
            });
          }

          // Cache HTML pages
          if (isHtmlRequest) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to cached index.html if offline
            return caches.match('/Random-Guess/index.html');
          });
        })
    );
  }
});
