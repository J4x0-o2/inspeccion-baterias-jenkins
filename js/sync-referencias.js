/**
 * SINCRONIZADOR DE REFERENCIAS
 * Verifica cada 1 hora si hay cambios en las referencias
 * Muestra notificación persistente si hay cambios
 */

const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hora en ms
const REFERENCIAS_HASH_KEY = 'referencias_hash';
let hayCambios = false;

// ========== HASH DE REFERENCIAS ==========

function calcularHash(referencias) {
    return JSON.stringify(referencias).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a; // Convertir a 32bit
    }, 0).toString(36);
}

function obtenerHashLocal() {
    return localStorage.getItem(REFERENCIAS_HASH_KEY) || '';
}

function guardarHashLocal(hash) {
    localStorage.setItem(REFERENCIAS_HASH_KEY, hash);
}

// ========== VERIFICACIÓN DE CAMBIOS ==========

async function verificarCambiosReferencias() {
    try {
        const response = await fetch('/.netlify/functions/referencias', {
            method: 'GET'
        });
        
        if (!response.ok) throw new Error('Error al obtener referencias');
        
        const data = await response.json();
        const referencias = data.referencias || [];
        
        const hashRemoto = calcularHash(referencias);
        const hashLocal = obtenerHashLocal();
        
        // Si no hay hash local, es la primera vez - guardar y salir
        if (!hashLocal) {
            guardarHashLocal(hashRemoto);
            return false;
        }
        
        // Si los hashes son diferentes, hay cambios
        if (hashRemoto !== hashLocal) {
            console.log('🔄 Cambios detectados en referencias');
            guardarHashLocal(hashRemoto);
            
            // Guardar referencias nuevas localmente
            localStorage.setItem('baterias_referencias_admin', JSON.stringify(referencias));
            
            mostrarNotificacionActualizacion();
            hayCambios = true;
            return true;
        }
        
        return false;
    } catch (error) {
        console.warn('⚠️ Error verificando referencias:', error.message);
        return false;
    }
}

// ========== NOTIFICACIÓN PERSISTENTE ==========

function mostrarNotificacionActualizacion() {
    // No mostrar si ya está visible
    if (document.getElementById('update-notification')) {
        return;
    }
    
    const notif = document.createElement('div');
    notif.id = 'update-notification';
    notif.className = 'fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-lg z-[9998] animate-pulse';
    notif.innerHTML = `
        <div class="container mx-auto flex justify-between items-center gap-4">
            <div class="flex-1">
                <p class="font-bold text-lg">🔄 Nuevas referencias disponibles</p>
                <p class="text-sm opacity-90">El administrador ha actualizado las referencias de baterías. Recarga la página para ver los cambios.</p>
            </div>
            <button onclick="location.reload()" class="bg-white text-blue-600 px-6 py-2 rounded font-bold hover:bg-gray-100 transition whitespace-nowrap">
                ↻ Recargar
            </button>
        </div>
    `;
    
    document.body.insertBefore(notif, document.body.firstChild);
    
    // Prevenir cerrar (sin botón de cerrar)
    // El aviso solo desaparece con reload
}

// ========== INICIALIZACIÓN ==========

function iniciarSincronizador() {
    // Verificar inmediatamente al cargar
    verificarCambiosReferencias();
    
    // Luego cada 1 hora
    setInterval(() => {
        verificarCambiosReferencias();
    }, SYNC_INTERVAL);
    
    console.log('✅ Sincronizador de referencias iniciado (cada 1 hora)');
}

// Iniciar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSincronizador);
} else {
    iniciarSincronizador();
}
