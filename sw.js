/* Ngày 50k – bộ nhớ đệm để app mở được khi không có mạng.
   Mỗi lần sửa app, hãy tăng số phiên bản dưới đây (v1 -> v2 ...) để máy nhận bản mới. */
const VERSION = "ngay50k-v23";

const ASSETS = [
  "./",
  "./index.html",
  "./scan.html",
  "./manifest.webmanifest",
  "./vendor/jsQR.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./fonts/be-vietnam-pro-latin-400-normal.woff2",
  "./fonts/be-vietnam-pro-latin-500-normal.woff2",
  "./fonts/be-vietnam-pro-latin-600-normal.woff2",
  "./fonts/be-vietnam-pro-latin-800-normal.woff2",
  "./fonts/be-vietnam-pro-latin-ext-400-normal.woff2",
  "./fonts/be-vietnam-pro-latin-ext-500-normal.woff2",
  "./fonts/be-vietnam-pro-latin-ext-600-normal.woff2",
  "./fonts/be-vietnam-pro-latin-ext-800-normal.woff2",
  "./fonts/be-vietnam-pro-vietnamese-400-normal.woff2",
  "./fonts/be-vietnam-pro-vietnamese-500-normal.woff2",
  "./fonts/be-vietnam-pro-vietnamese-600-normal.woff2",
  "./fonts/be-vietnam-pro-vietnamese-800-normal.woff2",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ngay50k-") && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isAppPage = url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (req.mode === "navigate" && isAppPage) {
    event.respondWith(
      caches.match("./index.html").then(hit => {
        const net = fetch(req).then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
