/* Working Sheet service worker.
 *
 * - Pages: network first, falling back to the last copy, then to /offline.
 * - Static files (JS, CSS, fonts, icons): cache first.
 * - Never touches /api, other websites (Supabase, Paystack, news images) or
 *   anything that isn't a GET, so accounts, payments and live data stay live.
 *
 * The version comes from this file's URL (?v=<build id>), so every deploy gets
 * a fresh cache and the old one is deleted.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PAGES = `mc-pages-${VERSION}`;
const STATIC = `mc-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const MAX_STATIC = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGES).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith("mc-") && !key.endsWith(VERSION)) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

// The page asks us to take over once the user chooses to update.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const copy = response.clone();
      caches.open(PAGES).then((cache) => cache.put(request, copy));
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: false });
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    caches.open(STATIC).then(async (cache) => {
      await cache.put(request, copy);
      trim(STATIC, MAX_STATIC);
    });
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    /\.(?:woff2?|png|svg|ico|webp|jpg)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request));
  }
});
