const CACHE_NAME = 'africart-pwa-v2';

// 1. Guaranteed Instant Installation:
// Statically pre-caching files during install is prone to hanging if a single request fails or returns a 404.
// By keeping the installation phase completely lightweight, we guarantee immediate installation with zero hanging.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Active Activation:
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

// 3. Dynamic Cache-First / Network-Fallback Strategy:
self.addEventListener('fetch', (event) => {
  // Only handle standard GET requests
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  
  // Avoid caching analytical, admin, vendor panels or backend API routes
  if (
    url.includes('/api/') || 
    url.includes('/admin') ||
    url.includes('/vendor') ||
    url.startsWith('chrome-extension://')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Cache successful GET responses from our same origin
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Return cached version if network fails
        });

      return cachedResponse || fetchPromise;
    })
  );
});
