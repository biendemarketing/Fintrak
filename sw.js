const CACHE_NAME = 'fintrack-v1';
// Lista de archivos para almacenar en caché.
// Se incluyen los archivos esenciales para que la app pueda arrancar offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // La URL de los logos que nos dieron.
  'https://psqewnhpietbdjpvmyof.supabase.co/storage/v1/object/public/images/FinTrak%20Logo_192.png',
  'https://psqewnhpietbdjpvmyof.supabase.co/storage/v1/object/public/images/FinTrak%20Logo_512.png'
  // El navegador almacenará en caché automáticamente los scripts y otros recursos
  // a medida que se soliciten, gracias al evento 'fetch'.
];

// Evento 'install': se dispara cuando el Service Worker se instala.
self.addEventListener('install', event => {
  // Esperamos a que la promesa de la instalación se resuelva.
  event.waitUntil(
    // Abrimos la caché con el nombre que definimos.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Agregamos todos los archivos de nuestra lista a la caché.
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento 'fetch': se dispara cada vez que la página hace una solicitud de un recurso.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Buscamos si la solicitud ya existe en nuestra caché.
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en la caché, la devolvemos.
        if (response) {
          return response;
        }

        // Si no está en la caché, la buscamos en la red.
        return fetch(event.request).then(
          response => {
            // Si la respuesta no es válida, simplemente la devolvemos.
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Hacemos una copia de la respuesta.
            const responseToCache = response.clone();

            // Abrimos la caché y guardamos la nueva respuesta para futuras solicitudes.
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Evento 'activate': se dispara cuando el Service Worker se activa.
// Se usa para limpiar cachés antiguas.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Si la caché no está en nuestra lista blanca, la eliminamos.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});