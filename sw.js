/* 离线缓存:第一次打开之后存进手机,github 连不上也照样能用
   策略:页面走「先联网、连不上再吃缓存」,图片走「先缓存、没有再联网」
   这样既能拿到我推的新版,又不怕断网 */
const CACHE = 'meishaotu-0830-0145';
const CORE = [
  './',
  './index.html',
  './img/toshi-head.png',
  './img/sansan-head.png',
  './img/icon-180.png',
  './img/icon-192.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const isPage = req.mode === 'navigate' || req.destination === 'document';

  if (isPage) {
    // 先联网拿最新的,拿到就顺手更新缓存;连不上就用上次存的
    e.respondWith(
      fetch(req)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return r;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // 图片这些不会变,先吃缓存,快
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => hit))
  );
});
