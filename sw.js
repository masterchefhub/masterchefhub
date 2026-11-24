/* MasterChefHub service worker: pages always come from the network. If there is no connection, show the offline page. */
var OFF = '/offline.html', V = 'mch-off-1';
self.addEventListener('install', function (e) { e.waitUntil(caches.open(V).then(function (c) { return c.add(OFF); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); })); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(function () { return caches.match(OFF); }));
});
