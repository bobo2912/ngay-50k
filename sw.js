/* Tiêu Gọn – bộ nhớ đệm để app mở được khi không có mạng.
   Mỗi lần sửa app, hãy tăng số phiên bản dưới đây (v1 -> v2 ...) để máy nhận bản mới. */
const V = "133";                                   /* tăng cùng lúc với ?v= trong index.html (xem README) */
const VERSION = "ngay50k-v" + V;

/* Trang chính và các file script luôn đi cùng một bản: script có đuôi ?v=<số bản>, và chỉ lấy từ đúng bộ nhớ đệm
   của bản đó. Trước v83, trang chính và script được cập nhật lệch nhau, iPhone có lúc chạy trang mới với script cũ
   (hoặc thiếu hẳn lock.js) nên app đơ ngay khi mở. */
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./parse-vi.js?v=" + V,
  "./lock.js?v=" + V,
  "./thu-vien-cau.js?v=" + V,
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

/* chờ mạng tối đa ms mili giây; quá thì dùng bản đã lưu (mạng yếu không làm app treo lúc mở) */
function netWithin(req, ms){
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("slow")), ms);
    fetch(req, { cache: "no-store" }).then(r => { clearTimeout(t); r.ok ? resolve(r) : reject(new Error("HTTP " + r.status)); },
      e => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isAppPage = url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (req.mode === "navigate" && isAppPage) {
    /* trang chính: lấy bản mới trên mạng (tối đa 3,5 giây), không được thì dùng bản cài cùng service worker này.
       Không ghi đè bản đã lưu: bộ nhớ đệm chỉ đổi khi cả bộ file của bản mới đã tải xong (bước install). */
    event.respondWith(
      netWithin(req, 3500).catch(() => caches.open(VERSION).then(c => c.match("./index.html")).then(hit => hit || fetch(req)))
    );
    return;
  }

  /* file khác: đúng địa chỉ (kể cả ?v=) trong bộ nhớ đệm của bản này; không có thì lên mạng */
  event.respondWith(
    caches.open(VERSION).then(c => c.match(req)).then(hit => hit || fetch(req).then(res => {
      if (res.ok && !url.search) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});

/* Bấm vào thông báo (ngân sách AI sắp hết): mở lại app */
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      const c = list.find(w => "focus" in w);
      return c ? c.focus() : self.clients.openWindow("./");
    })
  );
});
