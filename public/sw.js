const CACHE = 'gymtracker-v1';
const STATIC = [
  '/',
  '/index.html',
  '/workout.html',
  '/exercises.html',
  '/history.html',
  '/measurements.html',
  '/nutrition.html',
  '/exercise-stats.html',
  '/css/style.css',
  '/js/api.js',
  '/js/cache.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: network first, no caching
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: cache first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
