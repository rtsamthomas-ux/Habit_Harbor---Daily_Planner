const CACHE = 'habit-harbor-v2';
const CACHE_PREFIX = 'habit-harbor-';
const CORE = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg', '/icons/icon-maskable.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);

    // The built HTML contains Vite's hashed JS and CSS filenames. Cache them
    // during installation so a first offline reopen does not need a warm-up visit.
    const response = await fetch('/');
    if (response.ok) {
      const html = await response.clone().text();
      await cache.put('/', response);
      const assets = [...html.matchAll(/\b(?:src|href)="([^\"]+\.(?:js|css)(?:\?[^\"]*)?)"/g)]
        .map((match) => new URL(match[1], self.location.origin))
        .filter((url) => url.origin === self.location.origin)
        .map((url) => url.href);
      await Promise.allSettled(assets.map((asset) => cache.add(asset)));
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const fetchAndStore = fetch(req)
        .then((res) => {
          if (res.ok && res.type !== 'opaque') cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      // Return cached pages and assets immediately, keeping their cache fresh online.
      if (req.mode === 'navigate') {
        if (cached) {
          event.waitUntil(fetchAndStore);
          return cached;
        }
        return (await fetchAndStore) || cache.match('/index.html');
      }
      if (cached) {
        event.waitUntil(fetchAndStore);
        return cached;
      }
      return (await fetchAndStore) || Response.error();
    })(),
  );
});
