const CACHE_NAME = 'africart-v7';

// Installation: skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation: take control of all clients and clean old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch handler: ALWAYS return a valid Response for navigation requests!
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Always bypass SW for API routes and browser extensions
  if (url.includes('/api/') || url.startsWith('chrome-extension://')) {
    return;
  }

  // Navigation requests (page loads / refreshes)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Fallback 1: Try matching request from cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // Fallback 2: Try matching root path from cache
        const rootCached = await caches.match('/');
        if (rootCached) return rootCached;

        // Fallback 3: Return a valid HTML response so Chromium NEVER shows "This page couldn't load"
        return new Response(
          '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="1"></head><body style="background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Reloading...</body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static assets (JS, CSS, images) -> Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 404 });
      })
  );
});
