// キャッシュのバージョンを更新（v1.1に）
const CACHE_NAME = 'layla-desk-v1.1';
// キャッシュするファイルにCSSやJS、JSONファイルを追加
const urlsToCache = [
  '/layla-desk/',
  '/layla-desk/index.html',
  '/layla-desk/characters.html',
  '/layla-desk/planning.html',
  '/layla-desk/css/style.css',
  '/layla-desk/js/app.js',
  '/layla-desk/data/characters.json',
  '/layla-desk/manifest.json'
];

// インストール処理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// ▼▼▼ 古いキャッシュを削除する処理を追加 ▼▼▼
// Service Workerが有効になったときに発動
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // ホワイトリストに含まれていないキャッシュ（＝古いキャッシュ）は削除する
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
// ▲▲▲ ここまでが新しい部分 ▲▲▲

// フェッチ処理（キャッシュ優先）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
