// Offline cache for the itinerary. The point is a page that opens on a plane,
// in airplane mode, or before a SIM is bought.
const V = 'trip-v1';
const ASSETS = [
  './',
  './index.html',
  './site.webmanifest',
  './apple-touch-icon.png',
  './favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Google fonts and the Maps embed are cross-origin and opaque: let them fail
  // naturally offline rather than caching something useless.
  if (new URL(req.url).origin !== location.origin) return;

  // Cache-first: an itinerary should open instantly with no network. The cost is
  // that a freshly pushed edit appears on the second open, not the first.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(V).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
