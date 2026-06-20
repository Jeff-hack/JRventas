// Service Worker mínimo — necesario para que Chrome/Android permita instalar la app
// con su propio ícono. No reescribe lógica de negocio, solo habilita la instalación.

const CACHE_NAME = 'jr-control-v1';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

// Estrategia: red primero, sin caché agresivo (la app usa localStorage/Firebase,
// no necesita funcionar 100% offline, solo necesita el SW presente para instalar).
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});
