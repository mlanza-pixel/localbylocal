// Local Like a Local - Service Worker (v3.52 Production Release)
const CACHE_NAME = 'local-like-a-local-v3.52';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './vendor/leaflet.css',
  './vendor/leaflet.js',
  './images/icon-192.png',
  './images/icon-512.png',
  './lbl-v3.52-fixes.js',
  './lbl-self-diagnostics.js',
  './lbl-responsive-fixes.js',
  './lbl-v3.52-fixes.js',
  './cities/palm_springs.json',
  './cities/baltimore.json',
  './cities/madrid.json',
  './cities/paris.json'
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
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
