/* eslint-disable */
/**
 * Adaptly service worker — zero-dependency, hand-rolled.
 *
 * Strategy:
 *   - Pre-cache the app shell (index.html, logo, manifest, offline fallback)
 *     on install, so repeat loads are instant and Add-to-Home-Screen works
 *     correctly on iOS.
 *   - Stale-while-revalidate for built static assets under /assets/ and any
 *     image / font (cached aggressively — Vite hashes filenames).
 *   - Network-first for navigations and HTML; falls back to /offline.html
 *     when the device is offline or the API server is unreachable, so the
 *     user sees something useful when school WiFi drops.
 *   - API calls (/api/*) are NEVER cached — they always go to the network.
 *     Auth, attendance, behaviour data must not be served stale.
 *   - Old caches are cleaned up on activate via a versioned cache name.
 *
 * Bump CACHE_VERSION whenever the app shell list changes.
 */

const CACHE_VERSION = "adaptly-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/logo.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // `addAll` is atomic — if any URL fails the install fails, so we use
      // individual `add` calls and ignore failures (e.g. logo missing in dev).
      await Promise.all(
        APP_SHELL.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
      // Activate immediately on first install so the page is controlled
      // without a manual reload.
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      // Take control of any pages that loaded before this SW was active.
      await self.clients.claim();
    })()
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Only handle GET — leave PUT/POST/DELETE alone.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle same-origin traffic. Cross-origin requests (CDNs, analytics)
  // pass straight through to the network.
  if (url.origin !== self.location.origin) return;

  // Never cache API traffic.
  if (isApiRequest(url)) return;

  // Navigation requests → network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const network = await fetch(request);
          // Mirror the latest HTML in the shell cache so we have something
          // to serve next time the user is offline.
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(request, network.clone()).catch(() => {});
          return network;
        } catch {
          const cache = await caches.open(APP_SHELL_CACHE);
          const cached = await cache.match(request);
          if (cached) return cached;
          const offline = await cache.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response(
            "<h1>You appear to be offline.</h1>",
            { headers: { "Content-Type": "text/html" }, status: 503 }
          );
        }
      })()
    );
    return;
  }

  // Static assets → stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200 && response.type === "basic") {
              cache.put(request, response.clone()).catch(() => {});
            }
            return response;
          })
          .catch(() => null);
        return cached || (await networkPromise) || fetch(request);
      })()
    );
  }
});

// Allow the page to ask the SW to take over immediately after an update.
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
