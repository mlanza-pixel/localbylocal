// Local Like a Local - Service Worker (Release v3.48a)
const CACHE_NAME = 'local-like-a-local-v3.48';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './vendor/leaflet.css',
    './vendor/leaflet.js',
    './cities/palm_springs.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
