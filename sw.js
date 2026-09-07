/* 布拉格手冊 Service Worker — 離線快取
 * 改版時把 CACHE_VERSION 加一,使用者下次連網開啟即自動更新。
 */
const CACHE_VERSION = 'prague-handbook-v1';

// 需離線可用的核心資源(相對於本檔位置,可放在任何子路徑)
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './hero.webp',
  './01.webp', './02.webp', './03.webp', './04.webp', './05.webp', './06.webp',
  './07.webp', './08.webp', './09.webp', './10.webp', './11.webp', './12.webp',
  './13.webp', './14.webp', './15.webp', './16.webp', './17.webp', './18.webp',
  './19.webp', './20.webp', './21.webp', './22.webp', './23.webp', './24.webp'
];

// 安裝:預先抓下所有核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 啟用:清掉舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 取用策略
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Google 字型:cache-first,首次連網後離線也能用正確字體
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((hit) =>
          hit || fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          }).catch(() => hit)
        )
      )
    );
    return;
  }

  // 同源導覽請求:離線時回退到已快取的 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 其他同源資源:cache-first,快取沒有才連網並補進快取
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});
