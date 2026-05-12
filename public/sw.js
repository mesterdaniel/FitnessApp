self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through all requests for now.
  // In a full PWA, we would cache assets here.
  event.respondWith(fetch(event.request));
});
