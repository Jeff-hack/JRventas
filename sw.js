// Service Worker — necesario para que Chrome/Android permita instalar la app
// con su propio ícono. No reescribe lógica de negocio, solo habilita la instalación.
// IMPORTANTE: cada vez que se suba una actualización importante, cambiar CACHE_NAME
// (por ejemplo de v2 a v3) para forzar a todos los dispositivos a tomar la versión nueva.

const CACHE_NAME = 'jr-control-v3-orbit';

self.addEventListener('install', function(event) {
  self.skipWaiting(); // activa el nuevo SW de inmediato, sin esperar a cerrar pestañas
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      // Borra cualquier caché de versiones anteriores
      caches.keys().then(function(cacheNames){
        return Promise.all(
          cacheNames.filter(function(name){ return name !== CACHE_NAME; })
                     .map(function(name){ return caches.delete(name); })
        );
      }),
      self.clients.claim() // toma control de todas las pestañas/ventanas abiertas YA
    ])
  );
});

// Estrategia: red primero, sin caché agresivo (la app usa localStorage/Firebase,
// no necesita funcionar 100% offline, solo necesita el SW presente para instalar).
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request, {cache:'no-store'}).catch(function() {
      return caches.match(event.request);
    })
  );
});
