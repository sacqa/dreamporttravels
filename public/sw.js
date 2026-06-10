// DreamPort Travels — service worker with offline fallback.
// Strategy:
//   - HTML navigations: NetworkFirst; if both network + per-URL cache miss, serve /offline.html.
//   - Hashed build assets + same-origin images/fonts: CacheFirst.
//   - Cross-origin (Supabase, fonts) and /api, /_serverFn: bypass (no caching of live data).
//   - autoUpdate: skipWaiting + clientsClaim so new versions take over immediately.

const VERSION = "v2";
const HTML_CACHE = `dpt-html-${VERSION}`;
const ASSET_CACHE = `dpt-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE_ROUTES = ["/", "/visas", "/umrah", "/checkout", "/contact", OFFLINE_URL];

const OWN_CACHES = [HTML_CACHE, ASSET_CACHE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(HTML_CACHE);
      await Promise.all(
        PRECACHE_ROUTES.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {}),
        ),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith("dpt-") && !OWN_CACHES.includes(n)).map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isHashedAsset(url) {
  return /\/_build\//.test(url.pathname) || /\/assets\/.*\.[a-f0-9]{8,}\./.test(url.pathname);
}
function isImageOrFont(req) {
  const d = req.destination;
  return d === "image" || d === "font";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(HTML_CACHE);
          cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch (_) {
          const cache = await caches.open(HTML_CACHE);
          const cached = (await cache.match(req)) || (await cache.match(url.pathname));
          if (cached) return cached;
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  if (isHashedAsset(url) || isImageOrFont(req)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
          return fresh;
        } catch (_) {
          return cached || Response.error();
        }
      })(),
    );
  }
});

// Background-sync style: when the page tells us connectivity is back,
// re-broadcast so any open clients can flush their queued inquiries.
self.addEventListener("sync", (event) => {
  if (event.tag === "flush-inquiries") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        clients.forEach((c) => c.postMessage({ type: "flush-inquiries" }));
      })(),
    );
  }
});
