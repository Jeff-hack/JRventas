// Service Worker — JR Control de Negocio
// Cambia CACHE_NAME en cada actualización importante para forzar la versión nueva en todos los dispositivos.
const CACHE_NAME = 'jr-control-v3';

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      caches.keys().then(function(names){
        return Promise.all(names.filter(function(n){ return n !== CACHE_NAME; })
                                .map(function(n){ return caches.delete(n); }));
      }),
      self.clients.claim()
    ])
  );
});

// Solo se intervienen: (1) archivos de la propia app y (2) el SDK de Firebase y las fuentes (archivos estáticos).
// TODO lo demás —sobre todo el tráfico de Firestore (firestore.googleapis.com)— pasa directo al navegador.
// Antes el SW interceptaba también Firestore, y Android podía cortar esas conexiones largas → fallas de sincronización.
function esEstatico(url){
  if(url.origin === self.location.origin) return true;
  return url.hostname === 'www.gstatic.com' && url.pathname.indexOf('/firebasejs/') === 0
      || url.hostname === 'fonts.googleapis.com'
      || url.hostname === 'fonts.gstatic.com';
}

// Red primero (siempre la versión más nueva); si no hay internet, la última copia guardada.
// Así la app abre aunque no haya señal.
self.addEventListener('fetch', function(event) {
  var req = event.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(!esEstatico(url)) return;
  event.respondWith(
    fetch(req, {cache:'no-store'}).then(function(res){
      if(res && (res.ok || res.type === 'opaque')){
        var copia = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(req, copia); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
