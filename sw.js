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

// Estrategia: Network First, falling back to cache
// Para que siempre intente traer la versión más nueva si hay red
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});