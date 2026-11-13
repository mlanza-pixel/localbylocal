// Local Like a Local - Service Worker (v3.73 Expanded Guides and Single-Pin Maps)
const CACHE_NAME = 'local-like-a-local-v3.73-time-slots-10526';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
  './images/icon-192.png',
  './images/icon-512.png',
  './lbl-v3.51-fixes.js',
  './lbl-v3.52-fixes.js',
  './lbl-v3.56-fixes.js',
  './lbl-self-diagnostics.js',
  './lbl-responsive-fixes.js',
  
  './lbl-v3.73-responsive.css',
  './lbl-v3.73-scheduler.js',
  './lbl-v3.64-book.css',
  './cities/chicago.json',
  './cities/new_york.json',
  './cities/los_angeles.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log('Cache addAll warning:', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        // Delete ALL old caches
        if (key !== CACHE_NAME) {
          console.log('SW: Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Only handle GET requests from same origin
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  
  // NETWORK-FIRST for HTML documents (always get the latest version)
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === './') {
    event.respondWith(
      fetch(req).then(res => {
        // Cache the new version
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => {
        // Offline — serve from cache
        return caches.match(req).then(cached => cached || caches.match('./index.html'));
      })
    );
    return;
  }
  
  // NETWORK-FIRST for JS files (so fixes always update)
  if ((url.pathname.endsWith('.js') || url.pathname.endsWith('.json'))) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }
  
  // CACHE-FIRST for everything else (images, JSON, CSS)
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return res;
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
