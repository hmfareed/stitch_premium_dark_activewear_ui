const CACHE_NAME = 'africart-pwa-v5';

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

// 3. Fetch handler — never block navigation requests.
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Always bypass SW for: API routes, chrome extensions
  if (
    url.includes('/api/') ||
    url.startsWith('chrome-extension://')
  ) {
    return;
  }

  // CRITICAL: For ALL page navigation requests (refreshes, direct URL visits),
  // do NOT call event.respondWith at all — let the browser handle it natively.
  // This prevents ANY service worker interference with page loads.
  if (event.request.mode === 'navigate') {
    return;
  }

  // For panel routes (admin, vendor, rider), skip the SW entirely.
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
