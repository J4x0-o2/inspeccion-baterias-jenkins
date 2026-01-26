/**
 * Admin Panel - Gestión de referencias de baterías
 * Requiere autenticación con Netlify Identity
 */

// ========== VARIABLES GLOBALES ==========
const BATERIAS_STORAGE_KEY = 'baterias_referencias_admin';
let user = null;

// ========== NETLIFY IDENTITY ==========

// Inicializar Netlify Identity
if (window.netlifyIdentity) {
    netlifyIdentity.on('init', (user) => {
        if (!user) {
            // No autenticado - mostrar login
            mostrarLogin();
        } else {
            // Autenticado - mostrar panel
            user = user;
            mostrarPanel();
        }
    });

    netlifyIdentity.on('login', (user) => {
        user = user;
        mostrarPanel();
        location.reload(); // Recargar para actualizar la interfaz
    });

    netlifyIdentity.on('logout', () => {
        user = null;
        location.reload(); // Recargar y volver a login
    });
}

function mostrarLogin() {
    const loginModal = document.getElementById('login-modal');
    const loginBtn = document.getElementById('login-btn');
    const loginMessage = document.getElementById('login-message');
    
    // Mostrar modal
    loginModal.classList.remove('hidden');
    
    // Ocultar contenido principal
    document.querySelector('main').classList.add('hidden');
    
    // Manejar click en botón de login
    loginBtn.addEventListener('click', () => {
        netlifyIdentity.open('login');
    });
}

function mostrarPanel() {
    const loginModal = document.getElementById('login-modal');
    loginModal.classList.add('hidden');
    document.querySelector('main').classList.remove('hidden');
    
    // Cargar referencias
    cargarBaterias();
    
    // Manejar logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        netlifyIdentity.logout();
    });
}

// ========== GESTIÓN DE REFERENCIAS ==========

// Estructura de una batería:
// {
//   id: "244105506R",
//   referencia: "244105506R",
//   cargaMin: 100,
//   cargaMax: 150,
//   pesoMin: 10,
//   pesoMax: 15,
//   fechaCreacion: "2026-01-26T..."
// }

function obtenerBaterias() {
    const datos = localStorage.getItem(BATERIAS_STORAGE_KEY);
    return datos ? JSON.parse(datos) : [];
}

async function guardarBaterias(baterias) {
    // Guardar localmente
    localStorage.setItem(BATERIAS_STORAGE_KEY, JSON.stringify(baterias));
    syncBateriasConIndexedDB(baterias);
    
    // Guardar en Google Sheets a través de Netlify Function
    try {
        const response = await fetch('/.netlify/functions/send-to-sheets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'guardarReferencias',
                baterias: baterias,
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            console.log('✅ Referencias sincronizadas con Google Sheets');
        }
    } catch (error) {
        console.warn('⚠️ No se pudo sincronizar con servidor:', error.message);
    }
}

function agregarBateria(datosForm) {
    const baterias = obtenerBaterias();
    
    // Validar que no exista ya
    if (baterias.some(b => b.referencia === datosForm.referencia)) {
        alert('❌ Esta referencia ya existe');
        return false;
    }
    
    // Crear nueva batería
    const nuevaBateria = {
        id: datosForm.referencia,
        referencia: datosForm.referencia,
        cargaMin: parseFloat(datosForm.cargaMin),
        cargaMax: parseFloat(datosForm.cargaMax),
        pesoMin: parseFloat(datosForm.pesoMin),
        pesoMax: parseFloat(datosForm.pesoMax),
        fechaCreacion: new Date().toISOString()
    };
    
    // Validar rangos
    if (nuevaBateria.cargaMin >= nuevaBateria.cargaMax) {
        alert('❌ La carga mínima debe ser menor a la máxima');
        return false;
    }
    
    if (nuevaBateria.pesoMin >= nuevaBateria.pesoMax) {
        alert('❌ El peso mínimo debe ser menor al máximo');
        return false;
    }
    
    baterias.push(nuevaBateria);
    guardarBaterias(baterias);
    
    console.log('✅ Batería agregada:', nuevaBateria);
    return true;
}

function eliminarBateria(referencia) {
    if (!confirm(`¿Eliminar la referencia ${referencia}?`)) {
        return false;
    }
    
    let baterias = obtenerBaterias();
    baterias = baterias.filter(b => b.referencia !== referencia);
    guardarBaterias(baterias);
    
    console.log('❌ Batería eliminada:', referencia);
    return true;
}

// ========== SINCRONIZACIÓN CON INDEXEDDB ==========

function syncBateriasConIndexedDB(baterias) {
    if (!window.indexedDB) return;
    
    const request = indexedDB.open('BateriasDB', 1);
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('referencias')) {
            db.createObjectStore('referencias', { keyPath: 'id' });
        }
    };
    
    request.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction('referencias', 'readwrite');
        const store = tx.objectStore('referencias');
        
        // Limpiar y recargar
        store.clear();
        baterias.forEach(b => store.add(b));
    };
}

// ========== INTERFAZ DE USUARIO ==========

function cargarBaterias() {
    const baterias = obtenerBaterias();
    const listContainer = document.getElementById('baterias-list');
    
    if (baterias.length === 0) {
        listContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No hay referencias configuradas aún</p>';
        return;
    }
    
    listContainer.innerHTML = baterias.map(bateria => `
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="text-lg font-bold text-blue-600">${bateria.referencia}</h3>
                    <div class="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                            <span class="text-gray-600">Carga (Ah):</span>
                            <p class="font-semibold">${bateria.cargaMin} - ${bateria.cargaMax}</p>
                        </div>
                        <div>
                            <span class="text-gray-600">Peso (kg):</span>
                            <p class="font-semibold">${bateria.pesoMin} - ${bateria.pesoMax}</p>
                        </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-2">
                        Creada: ${new Date(bateria.fechaCreacion).toLocaleDateString('es-ES')}
                    </p>
                </div>
                <button onclick="eliminarYRecargar('${bateria.referencia}')" 
                        class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold transition">
                    🗑️ Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function eliminarYRecargar(referencia) {
    if (eliminarBateria(referencia)) {
        cargarBaterias();
    }
}

// ========== FORM SUBMISSION ==========

document.getElementById('admin-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const datosForm = {
        referencia: document.getElementById('ref-bateria').value.trim(),
        cargaMin: document.getElementById('carga-min').value,
        cargaMax: document.getElementById('carga-max').value,
        pesoMin: document.getElementById('peso-min').value,
        pesoMax: document.getElementById('peso-max').value
    };
    
    if (agregarBateria(datosForm)) {
        // Limpiar form
        document.getElementById('admin-form').reset();
        // Recargar lista
        cargarBaterias();
        // Mostrar confirmación
        mostrarNotificacion('✅ Batería agregada correctamente');
    }
});

function mostrarNotificacion(mensaje) {
    const notif = document.createElement('div');
    notif.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[9999]';
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

// ========== INICIALIZACIÓN ==========

// Forzar autenticación al cargar
if (window.netlifyIdentity) {
    netlifyIdentity.init();
}
