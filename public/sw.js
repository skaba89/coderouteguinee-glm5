/*
 * CodeRoute Guinée — Service Worker
 * Version: 1.0.0
 *
 * Strategy:
 *  - Static assets (JS/CSS/fonts/images): cache-first (stale-while-revalidate)
 *  - HTML navigations: network-first, fall back to cached /offline
 *  - API calls: network-only (always fresh; no caching of dynamic data)
 */

const VERSION = 'v1.0.0';
const STATIC_CACHE = `cr-static-${VERSION}`;
const PAGE_CACHE = `cr-pages-${VERSION}`;
const OFFLINE_URL = '/offline';

// Pre-cache the offline page + manifest + main icons on install.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (e) {
        // Some assets may 404 in dev — ignore non-fatal errors.
        console.warn('[SW] Precache partial failure:', e);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.endsWith(VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip cross-origin requests entirely (e.g., Google Fonts, CDN).
  if (url.origin !== self.location.origin) return;

  // Never cache API responses — they must always be fresh.
  if (url.pathname.startsWith('/api/')) return;

  // HTML navigations → network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static assets → stale-while-revalidate.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: try network, fall back to cache.
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r || Response.error()))
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const fresh = await fetch(request);
    // Cache successful navigations for offline use.
    if (fresh && fresh.ok && fresh.type === 'basic') {
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
