const CACHE_NAME = 'mijan-crm-pwa-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/icon.svg',
  '/favicon.svg',
  '/apple-touch-icon.png'
];

// Install: Cache essential shell assets immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('PWA Precache partial fail:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
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

// Fetch: Smart network-first / cache-fallback strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests (e.g. POST /api/pos/checkout)
  if (req.method !== 'GET') {
    return;
  }

  // Handle API requests: Network first with offline friendly fallback
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(req).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'অফলাইন মোড — কোনো ইন্টারনেট সংযোগ পাওয়া যায়নি।',
            offline: true
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // Handle Navigation (HTML): Network first, fallback to cached index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(async () => {
        const cached = await caches.match('/index.html');
        return cached || caches.match('/');
      })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts): Cache first or Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const resClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return networkResponse;
      }).catch(() => {
        // Optional offline image/asset fallback
        return null;
      });
    })
  );
});

// Listen for skip waiting message from app client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
