const CACHE_NAME = 'local-like-local-v3.45';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Handle HTML navigation and JSON dataset requests
  if (e.request.mode === 'navigate' || url.includes('index.html') || url.includes('.json')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Handle asset and external requests with safe catch block to eliminate uncaught promise rejections
    e.respondWith(
      caches.match(e.request).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(e.request).catch((err) => {
          console.warn('[ServiceWorker] Graceful offline fallback for URL:', url);
          return new Response('', { status: 404, statusText: 'Offline / Fetch Failed' });
        });
      })
    );
  }
});
