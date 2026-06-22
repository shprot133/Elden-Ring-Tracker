const CACHE_PREFIX = "elden-ring-tracker-";
const DATA_URL = "./tracker-data.js?v=20260622-03";
const ASSETS = [
  "./",
  "./index.html",
  DATA_URL,
  "./manifest.json?v=2",
  "./icons/icon-192.png?v=2",
  "./icons/icon-512.png?v=2"
];

async function getCacheName() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Tracker data is unavailable");
    const source = await response.text();
    const version = source.match(/databaseVersion:\s*["']([^"']+)["']/)?.[1];
    if (version) return `${CACHE_PREFIX}${version}`;
  } catch {
    // Fall back to the latest existing tracker cache while offline.
  }

  const existing = await caches.keys();
  return existing.find(key => key.startsWith(CACHE_PREFIX)) || `${CACHE_PREFIX}offline`;
}

const cacheNamePromise = getCacheName();

self.addEventListener("install", event => {
  event.waitUntil(
    cacheNamePromise.then(cacheName =>
      caches.open(cacheName).then(cache => cache.addAll(ASSETS))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    cacheNamePromise.then(async cacheName => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== cacheName)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" }).then(response => {
      if (response && response.status === 200 && response.type !== "opaque") {
        const copy = response.clone();
        return cacheNamePromise
          .then(cacheName => caches.open(cacheName))
          .then(cache => cache.put(event.request, copy))
          .catch(() => undefined)
          .then(() => response);
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === "navigate") return caches.match("./index.html");
      return Response.error();
    })
  );
});

self.addEventListener("message", event => {
  if (event.data?.action === "skipWaiting") self.skipWaiting();
});
