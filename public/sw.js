const CACHE_NAME = 'summit-assets-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/globe.svg',
    '/window.svg',
    '/file.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

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
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only cache GET requests and skip API calls
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return from cache OR fetch from network
            return response || fetch(event.request).then((fetchResponse) => {
                // Optionally cache new static internal assets
                return fetchResponse;
            });
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Summit";
    const options = {
        body: data.body || "You have a new notification!",
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: data.url || '/'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});
