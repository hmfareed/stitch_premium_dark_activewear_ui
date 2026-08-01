const CACHE_NAME = 'africart-pwa-v4';

// 1. Guaranteed Instant Installation:
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Active Activation — clear old caches:
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Network-First Strategy with proper navigation handling:
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Always bypass SW for: API routes, chrome extensions, and external URLs
  if (
    url.includes('/api/') ||
    url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // For ALL page navigation requests (refreshes, direct URL visits),
  // always go to the network — never serve from cache.
  // This prevents "page couldn't load" on refresh for any route.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only fall back to cache if truly offline
        return caches.match(event.request);
      })
    );
    return;
  }

  // For panel routes (admin, vendor, rider), skip the SW entirely so
  // the server always handles these authenticated routes fresh.
  if (
    url.includes('/admin') ||
    url.includes('/vendor') ||
    url.includes('/rider')
  ) {
    return;
  }

  // For static assets (JS, CSS, images, fonts) — network first, cache fallback:
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
