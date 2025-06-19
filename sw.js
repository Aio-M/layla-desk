const CACHE_NAME = 'layla-desk-v1.0';
const urlsToCache = [
  '/layla-desk/',
  '/layla-desk/index.html',
  '/layla-desk/characters.html',
  '/layla-desk/planning.html',
  '/layla-desk/manifest.json'
];

// インストール時のキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// リクエスト時の処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあれば返す、なければネットワークから取得
        return response || fetch(event.request);
      }
    )
  );
});
