const CACHE_NAME = 'battery-app-v3';
const ASSETS = [
    './',
    './index.html',
    './js/app.js',
    './js/database.js',
    './js/sync.js',
    './js/api.js',
    'https://cdn.tailwindcss.com'
];

// Instalación: Guardar archivos en caché
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

// Estrategia: Cache First, falling back to network
// Sirve desde cache primero (offline-first), actualiza desde red en background
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => {
            // Retorna del cache si existe
            if (cached) return cached;
            
            // Si no está en cache, intenta traer de la red
            return fetch(e.request).then(response => {
                // Cachear la respuesta para futuro uso offline
                if (response.ok && e.request.method === 'GET') {
                    const cache = caches.open(CACHE_NAME);
                    cache.then(c => c.put(e.request, response.clone()));
                }
                return response;
            }).catch(() => {
                // Si falla la red y no hay cache, retorna error offline
                return new Response('Offline - No hay conexión', { status: 503 });
            });
        })
    );
});