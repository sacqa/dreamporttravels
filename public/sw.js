// DreamPort Travels — minimal offline service worker.
// Strategy:
//   - HTML navigations: NetworkFirst (always try fresh, fall back to cached shell offline).
//   - Hashed build assets + same-origin images/fonts: CacheFirst (immutable, hashed URLs).
//   - Everything else (Supabase, APIs, cross-origin): bypass.
// autoUpdate: skipWaiting + clientsClaim means a new SW takes over immediately.

const VERSION = "v1";
const HTML_CACHE = `dpt-html-${VERSION}`;
const ASSET_CACHE = `dpt-assets-${VERSION}`;
const OFFLINE_URL = "/";

const OWN_CACHES = [HTML_CACHE, ASSET_CACHE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(HTML_CACHE);
      try { await cache.add(new Request(OFFLINE_URL, { cache: "reload" })); } catch (_) {}
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("dpt-") && !OWN_CACHES.includes(n))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isHashedAsset(url) {
  // Vite hashed assets typically live under /_build/ or /assets/ and include a content hash.
  return /\/_build\//.test(url.pathname) || /\/assets\/.*\.[a-f0-9]{8,}\./.test(url.pathname);
}

function isImageOrFont(req) {
  const dest = req.destination;
  return dest === "image" || dest === "font";
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache: cross-origin (Supabase, fonts.googleapis, gateway), auth, APIs.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_serverFn")) return;

  // HTML navigations → NetworkFirst, fall back to cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(HTML_CACHE);
          cache.put(OFFLINE_URL, fresh.clone()).catch(() => {});
          return fresh;
        } catch (_) {
          const cache = await caches.open(HTML_CACHE);
          const cached = (await cache.match(req)) || (await cache.match(OFFLINE_URL));
          if (cached) return cached;
          return new Response("Offline", { status: 503, headers: { "content-type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  // Hashed assets / images / fonts → CacheFirst.
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
