/*
 * sw.js
 * Service worker: cache-first for the app shell (instant loads, offline UI),
 * network for everything cross-origin (the Apps Script API is never cached).
 * Bump CACHE_VERSION on any shell change to invalidate old caches.
 */

const CACHE_VERSION = 'wef-shell-v4';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './js/app.js',
  './js/config.js',
  './js/api.js',
  './js/state.js',
  './js/sync.js',
  './js/actions.js',
  './js/offlineQueue.js',
  './js/utils/dom.js',
  './js/utils/storage.js',
  './js/utils/theme.js',
  './js/components/header.js',
  './js/components/bottomNav.js',
  './js/components/groupCard.js',
  './js/components/toast.js',
  './js/components/requestBanner.js',
  './js/components/announcementBanner.js',
  './js/components/searchBar.js',
  './js/components/statsBar.js',
  './js/components/serviceToggles.js',
  './js/components/chips.js',
  './js/components/skeleton.js',
  './js/pages/dashboard.js',
  './js/pages/addGroup.js',
  './js/pages/queueView.js',
  './js/pages/photoQueue.js',
  './js/pages/foodQueue.js',
  './js/pages/requests.js',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') {
    return; // writes always hit the network
  }
  if (new URL(request.url).origin !== self.location.origin) {
    return; // cross-origin (API) passes through to the network
  }
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const fallback = await caches.match('./index.html');
    return fallback || Response.error();
  }
}
