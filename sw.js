const CACHE_NAME = 'local-like-a-local-v3.48';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './vendor/leaflet.css',
    './vendor/leaflet.js'
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
            keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(res => res || fetch(event.request))
    );
});
