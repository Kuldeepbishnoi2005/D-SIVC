const CACHE_NAME = 'dsivc-pwa-cache-v1';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png'
];

// Install Event - Pre-cache static application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches & take control immediately
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

// Fetch Event - Strategic Caching (Security & Live Data Isolation)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. DO NOT CACHE: Supabase Auth & API requests (Protect user tokens and session data)
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/auth/v1') || url.pathname.includes('/rest/v1') || url.pathname.includes('/functions/v1')) {
    return; // Pass straight to network
  }

  // 3. DO NOT CACHE: Blockchain RPC nodes & Polygon Amoy requests (Ensure real-time chain validation)
  if (url.hostname.includes('polygon') || url.hostname.includes('drpc.org') || url.pathname.includes('verify_public_credential')) {
    return; // Pass straight to network
  }

  // 4. DO NOT CACHE: Public live verification endpoints
  if (url.pathname.startsWith('/verify')) {
    return; // Pass straight to network to prevent stale verification status
  }

  // 5. CACHE STRATEGY for Static Assets (App Shell, JS/CSS bundles, Images): Network-First falling back to Cache
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cached response when offline
        return caches.match(req);
      })
  );
});
