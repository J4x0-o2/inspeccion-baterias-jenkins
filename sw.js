// ============================================
// SERVICE WORKER - Control de caché y offline
// ============================================
// Implementa estrategia offline-first robusta

const CACHE_NAME = 'battery-app-v5';
const ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/database.js',
    '/js/sync.js',
    '/js/api.js',
    '/js/config.js',
    '/manifest.json',
    'https://cdn.tailwindcss.com'
];

const EXTERNAL_URLS = ['https://cdn.tailwindcss.com'];

// ============ INSTALACIÓN ============
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[SW] Instalando y cacheando assets...');
            
            // Cachear assets locales primero
            const localAssets = ASSETS.filter(url => !EXTERNAL_URLS.includes(url));
            
            try {
                await cache.addAll(localAssets);
                console.log('[SW] Assets locales cacheados');
            } catch (error) {
                console.warn('[SW] Error cacheando algunos assets:', error);
            }

            // Cachear recursos externos de forma segura
            for (const url of EXTERNAL_URLS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                        console.log(`[SW] ${url} cacheado`);
                    }
                } catch (error) {
                    console.warn(`[SW] No se pudo cachear ${url}:`, error);
                }
            }
        })
    );
    self.skipWaiting();
});

// ============ ESTRATEGIA DE FETCH ============
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    const isLocalRequest = url.origin === self.location.origin;

    // 0. Para API de referencias: Network First con caché persistente
    if (isLocalRequest && url.pathname === '/api/referencias') {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    // Clonar ANTES de consumir
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Sin conexión → servir del caché
                    console.log('[SW] Sin conexión para referencias - buscando en caché...');
                    return caches.match(e.request)
                        .then(cached => {
                            if (cached) {
                                console.log('[SW] ✅ Referencias cacheadas encontradas (OFFLINE)');
                                return cached;
                            }
                            // Si no hay caché → respuesta vacía pero válida
                            console.log('[SW] ❌ Sin caché de referencias disponible');
                            return new Response(
                                JSON.stringify({ 
                                    ok: true,
                                    referencias: [], 
                                    offline: true,
                                    source: 'offline-no-cache'
                                }),
                                { 
                                    headers: { 'Content-Type': 'application/json' },
                                    status: 200
                                }
                            );
                        });
                })
        );
        return;
    }

    // 1. Para APIs externas: Network First (intentar red primero)
    if (!isLocalRequest && (url.hostname.includes('script.google.com') || 
        url.hostname.includes('googleapis.com') ||
        url.hostname.includes('google.com'))) {
        
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    // Clonar ANTES de consumir
                    if (response.ok && e.request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Si no hay conexión, intentar servir del caché
                    return caches.match(e.request)
                        .then(cached => cached || createOfflineResponse(e.request));
                })
        );
        return;
    }

    // 2. Para archivos locales: Cache First (servir del caché primero)
    if (isLocalRequest) {
        e.respondWith(
            caches.match(e.request)
                .then(cached => {
                    if (cached) return cached;

                    return fetch(e.request).then(response => {
                        // Clonar ANTES de consumir
                        if (response.ok && e.request.method === 'GET') {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(e.request, responseClone);
                            });
                        }
                        return response;
                    }).catch(() => {
                        return createOfflineResponse(e.request);
                    });
                })
        );
        return;
    }

    // 3. Para todo lo demás: Stale While Revalidate (servir del caché pero revalidar en background)
    e.respondWith(
        caches.match(e.request)
            .then(cached => {
                const fetchPromise = fetch(e.request).then(response => {
                    if (response.ok && e.request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(e.request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => null);

                return cached || fetchPromise || createOfflineResponse(e.request);
            })
    );
});

// ============ ACTIVACIÓN ============
self.addEventListener('activate', (e) => {
    console.log('[SW] Activando y limpiando cachés antiguos...');
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log(`[SW] Eliminando caché antiguo: ${key}`);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ============ UTILIDADES ============

/**
 * Crea una respuesta offline genérica o específica según el tipo de request
 */
function createOfflineResponse(request) {
    // Para solicitudes de documentos HTML
    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/index.html')
            .then(response => response || new Response(
                '<h1>Aplicación Offline</h1><p>No hay conexión a internet</p>',
                { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
            ));
    }

    // Para solicitudes de API/JSON
    if (request.headers.get('accept')?.includes('application/json')) {
        return new Response(
            JSON.stringify({ offline: true, message: 'Sin conexión' }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
        );
    }

    return new Response('Offline', { status: 503 });
}

/**
 * Comunica cambios a todos los clientes
 */
function notifyClients(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}