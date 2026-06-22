// Serfbound offline app shell. Caches the built shell and assets on
// demand; never caches or fetches original game data (imports stay in
// the user's IndexedDB, which works offline by nature).
const CACHE = "serfbound-shell-v4";
const swVersion = CACHE;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(["./", "./manifest.webmanifest", "./icon.svg"]);
      // Precache the hashed build assets referenced by the shell, so the
      // very first visit is enough for offline play.
      const shell = await cache.match("./");
      if (shell !== undefined) {
        const html = await shell.text();
        const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map(
          (match) => match[1],
        );
        if (assets.length > 0) {
          await cache.addAll(assets);
        }
      }
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/__sw-version")) {
    event.respondWith(new Response(swVersion));
    return;
  }

  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Original data never flows through HTTP, but guard anyway.
  if (url.pathname.toLowerCase().endsWith(".pa")) {
    return;
  }

  // The gate-verification deck and the baked rigs are tooling that must never
  // go stale: always fetch fresh (fall back to cache only when offline, and
  // never store a copy that could shadow a newer deploy).
  if (url.pathname.includes("/playtest") || url.pathname.includes("/rigs/")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches
          .match(event.request, { ignoreSearch: true, ignoreVary: true })
          .then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  event.respondWith(
    (async () => {
      // Hashed build assets are immutable: cache-first keeps offline
      // module loads off the network entirely.
      if (url.pathname.includes("/assets/")) {
        const cached = await caches.match(event.request, { ignoreSearch: true, ignoreVary: true });
        if (cached !== undefined) {
          return cached;
        }
      }

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }

        return response;
      } catch {
        const cached = await caches.match(event.request, { ignoreSearch: true, ignoreVary: true });
        if (cached !== undefined) {
          return cached;
        }

        // Navigation falls back to the cached shell.
        if (event.request.mode === "navigate") {
          const shell = await caches.match("./");
          if (shell !== undefined) {
            return shell;
          }
        }

        return Response.error();
      }
    })(),
  );
});
