// Minimal service worker: makes the site installable. It caches nothing, so a speed test always uses the live network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
