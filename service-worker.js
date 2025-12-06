const CACHE_NAME = 'books-by-nik-cache-v1';
// List the essential files needed for the app to run offline
const urlsToCache = [
    '/BooksByNIK-PWA/',
    '/BooksByNIK-PWA/index.html',
    '/BooksByNIK-PWA/script.js',
    '/BooksByNIK-PWA/manifest.json',
    '/BooksByNIK-PWA/icons/icon-192x192.png',
    '/BooksByNIK-PWA/icons/icon-512x512.png',
    // We don't cache the API data, as that must always be fresh from the sheet!
];

// 1. INSTALL Event: Pre-caching all essential assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 2. ACTIVATE Event: Cleaning up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. FETCH Event: Serving cached assets first (Cache-First Strategy)
self.addEventListener('fetch', event => {
    // Only apply the caching strategy to assets (CSS, JS, Icons, HTML)
    // For API calls, we let the network handle it (Network-Only strategy)
    if (event.request.url.includes(location.origin) && !event.request.url.includes('script.google.com')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // No hit - fetch from network
                    return fetch(event.request);
                })
        );
    }
});
