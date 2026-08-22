const CACHE_NAME = "shitong-cloud-v44";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=42",
  "./app.js?v=44",
  "./manifest.webmanifest",
  "./courier.html",
  "./factory.html",
  "./track.html",
  "./assets/wecom-service.png",
  "./vendor/xlsx.full.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((asset) =>
          fetch(asset, { cache: "reload" }).then((response) => {
            if (!response.ok) throw new Error(`缓存资源失败：${asset}`);
            return cache.put(asset, response);
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  const isAppShellRequest = requestUrl.origin === self.location.origin && (
    event.request.mode === "navigate"
    || requestUrl.pathname.endsWith(".html")
    || requestUrl.pathname.endsWith(".js")
    || requestUrl.pathname.endsWith(".css")
  );

  if (isAppShellRequest) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => caches.match("./index.html")),
    ),
  );
});
