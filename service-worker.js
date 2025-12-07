// --- CRITICAL CHANGE: INCREMENT CACHE VERSION ---
const CACHE_NAME = 'books-by-nik-cache-v3'; // Must be changed from v2 to force update

// List the essential files needed for the app to run offline
const urlsToCache = [
    '/BooksByNIK-PWA/', 
    '/BooksByNIK-PWA/index.html',
    '/BooksByNIK-PWA/script.js',
    '/BooksByNIK-PWA/manifest.json',
    '/BooksByNIK-PWA/icons/icon-192x192.png',
    '/BooksByNIK-PWA/icons/icon-512x512.png',
];

// List of critical files that must be up-to-date (Network-First)
const networkFirstUrls = [
    '/BooksByNIK-PWA/index.html', 
    '/BooksByNIK-PWA/script.js'
];


// 1. INSTALL Event: Pre-caching all essential assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened new cache version');
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
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. FETCH Event: Dynamic Strategy
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);
    const isLocalAsset = requestUrl.origin === location.origin;
    const isApiCall = requestUrl.href.includes('script.google.com');

    // 1. Network-Only Strategy for API calls
    if (isApiCall) {
        return; 
    }

    // 2. Network-First Strategy for critical files (index.html, script.js)
    if (isLocalAsset && networkFirstUrls.includes(requestUrl.pathname)) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Always try to update the cache with the fresh network response
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request)) // Fallback to cache if network fails
        );
        return;
    }

    // 3. Cache-First Strategy for everything else (icons, manifest, css)
    if (isLocalAsset) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    }
});