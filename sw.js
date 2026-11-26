'use strict';
const CACHE_PREFIX = 'solar-projects-pwa-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + 'v2';
const OFFLINE_URL = new URL('offline.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const response = await fetch(OFFLINE_URL, { cache: 'reload', credentials: 'same-origin', redirect: 'error' });
      // Never cache sign-in pages or the authenticated application shell.
      if (response.ok && !response.redirected && (await response.clone().text()).includes('data-app-offline="solar-projects"')) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(OFFLINE_URL, response);
      }
    } catch { /* Offline fallback below also works if this prefetch fails. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      // Keep authentication checks online and always load the current app version.
      return await fetch(event.request);
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const offline = await cache.match(OFFLINE_URL);
      return offline || new Response('<!doctype html><html lang="lt"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nėra ryšio</title><p>Prisijunkite prie interneto ir atidarykite programėlę dar kartą.</p></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  })());
});
