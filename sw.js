const CACHE_NAME = 'battery-app-v4';
const ASSETS = [
    './',
    './index.html',
    './js/app.js',
    './js/database.js',
    './js/sync.js',
    './js/api.js',
    './manifest.json',
    'https://cdn.tailwindcss.com'
];

// Lista de URLs que deben cachearse por separado
const EXTERNAL_URLS = ['https://cdn.tailwindcss.com'];

// Instalación: Guardar archivos en caché
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Cachear assets locales
            const localAssets = ASSETS.filter(url => !EXTERNAL_URLS.includes(url));
            await cache.addAll(localAssets);
            
            // Cachear recursos externos (CDN) de forma segura
            for (const url of EXTERNAL_URLS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (error) {
                    console.warn(`No se pudo cachear ${url}:`, error);
                }
            }
        })
    );
    self.skipWaiting();
});

// Estrategia: Cache First para todo, Network First para APIs
// Los archivos locales y CDN se sirven desde cache (offline-first)
// Las peticiones a APIs intentan red primero
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // Para peticiones a APIs (Google Sheets, etc): Network First
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1' && 
        !url.hostname.includes('script.google.com') === false) {
        e.respondWith(
            fetch(e.request)
                .catch(() => caches.match(e.request))
        );
        return;
    }
    
    // Para todo lo demás: Cache First (archivos locales + CDN)
    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            
            return fetch(e.request).then(response => {
                if (response.ok && e.request.method === 'GET') {
                    caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
                }
                return response;
            }).catch(() => {
                return new Response('Offline - No hay conexión', { status: 503 });
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});