// Este archivo maneja la lógica del formulario, captura datos de baterías, los guarda localmente en IndexedDB y sincroniza con Google Sheets cuando hay conexión.

const form = document.getElementById('battery-form');

// ============ GESTIÓN DEL CONTADOR ============
const CONTADOR_KEY = 'baterias_registradas_contador';

// Función para obtener el contador actual
function obtenerContador() {
    const contador = localStorage.getItem(CONTADOR_KEY);
    return contador ? parseInt(contador) : 0;
}

// Función para actualizar el contador en localStorage y en la UI
function actualizarContador(nuevoValor) {
    localStorage.setItem(CONTADOR_KEY, nuevoValor);
    const display = document.getElementById('contador-display');
    if (display) {
        display.textContent = nuevoValor;
    }
}

// Función para incrementar el contador
function incrementarContador() {
    const contador = obtenerContador();
    actualizarContador(contador + 1);
}

// Función para reiniciar el contador
function reiniciarContador() {
    if (confirm('¿Estás seguro de que deseas reiniciar el contador? Se perderán los datos del contador actual.')) {
        actualizarContador(0);
    }
}

// Cargar el contador cuando se carga la página
function cargarContador() {
    const contador = obtenerContador();
    const display = document.getElementById('contador-display');
    if (display) {
        display.textContent = contador;
    }
}

// Agregar evento al botón de reinicio
document.getElementById('reset-contador').addEventListener('click', reiniciarContador);

// Cargar el contador al iniciar
cargarContador();

// Función para calcular días entre dos fechas
function calcularDias() {
    const fechaInspeccion = document.getElementById('fechaInspeccion').value;
    const fechaRecarga = document.getElementById('fechaRecarga').value;
    const diasInput = document.getElementById('dias');
    
    if (fechaInspeccion && fechaRecarga) {
        const fecha1 = new Date(fechaInspeccion);
        const fecha2 = new Date(fechaRecarga);
        
        // Calcular la diferencia en milisegundos
        const diferencia = Math.abs(fecha2 - fecha1);
        
        // Convertir a días
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        
        diasInput.value = dias;
        
        // Marcar en rojo si es >= 21 días
        if (dias >= 21) {
            diasInput.classList.add('bg-red-200', 'border-red-500');
            diasInput.classList.remove('bg-gray-100');
        } else {
            diasInput.classList.remove('bg-red-200', 'border-red-500');
            diasInput.classList.add('bg-gray-100');
        }
    } else {
        diasInput.value = '';
        diasInput.classList.remove('bg-red-200', 'border-red-500');
        diasInput.classList.add('bg-gray-100');
    }
}

// Rango de peso válido por referencia de batería
const pesoRanges = {
    '244105506R': { min: 14.80, max: 16.10, label: '14,80kg - 16,10kg' },
    '244103318R': { min: 16.55, max: 17.97, label: '16,55kg - 17,97kg' }
};

// Rango de voltaje válido por referencia de batería
const voltajeRanges = {
    '244105506R': { min: 12.70, max: 12.95, label: '12,70V - 12,95V' },
    '244103318R': { min: 12.70, max: 13.00, label: '12,70V - 13,00V' }
};

// Función para validar el peso según la referencia de batería
function validarPeso() {
    const refBateria = document.getElementById('refBateria').value;
    const pesoInput = document.getElementById('peso');
    const peso = parseFloat(pesoInput.value);
    
    if (!peso || isNaN(peso)) {
        pesoInput.classList.remove('bg-red-200', 'border-red-500');
        return;
    }
    
    const range = pesoRanges[refBateria];
    
    if (range && (peso < range.min || peso > range.max)) {
        pesoInput.classList.add('bg-red-200', 'border-red-500');
    } else {
        pesoInput.classList.remove('bg-red-200', 'border-red-500');
    }
}

// Función para validar el voltaje según la referencia de batería
function validarVoltaje() {
    const refBateria = document.getElementById('refBateria').value;
    const cargaInput = document.getElementById('carga');
    const carga = parseFloat(cargaInput.value);
    
    if (!carga || isNaN(carga)) {
        cargaInput.classList.remove('bg-red-200', 'border-red-500');
        return;
    }
    
    const range = voltajeRanges[refBateria];
    
    if (range && (carga < range.min || carga > range.max)) {
        cargaInput.classList.add('bg-red-200', 'border-red-500');
        console.log(`Carga fuera de rango: ${carga} (válido: ${range.label})`);
    } else {
        cargaInput.classList.remove('bg-red-200', 'border-red-500');
    }
}

// Agregar listeners a las fechas para calcular automáticamente
document.getElementById('fechaInspeccion').addEventListener('change', calcularDias);
document.getElementById('fechaRecarga').addEventListener('change', calcularDias);

// Agregar listeners para validar peso y voltaje
document.getElementById('refBateria').addEventListener('change', () => {
    validarPeso();
    validarVoltaje();
});
document.getElementById('peso').addEventListener('input', validarPeso);
document.getElementById('peso').addEventListener('change', validarPeso);
document.getElementById('carga').addEventListener('input', validarVoltaje);
document.getElementById('carga').addEventListener('change', validarVoltaje);

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Función auxiliar para obtener valores de forma segura y evitar el error "null"
    const getValue = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Error: No se encontró el elemento con ID: ${id}`);
            return "";
        }
        return el.value;
    };

    // 1. Capturar datos coincidiendo EXACTAMENTE con los IDs del HTML
    const formData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        deviceType: getDeviceType(),
        
        // Datos del Formulario
        refBateria: getValue('refBateria'),
        inspector: getValue('inspector'),
        fechaInspeccion: getValue('fechaInspeccion'),
        fechaFabricacion: getValue('fechaFabricacion'),
        fechaRecarga: getValue('fechaRecarga'),
        
        bornes: getValue('bornes'),
        calcomanias: getValue('calcomanias'),
        tapones: getValue('tapones'),
        fugas: getValue('fugas'),
        aspectoGeneral: getValue('aspectoGeneral'),
        
        carga: parseFloat(getValue('carga')) || 0,
        peso: parseFloat(getValue('peso')) || 0,
        formula: parseInt(getValue('formula')) || 0,
        dias: parseInt(getValue('dias')) || 0,
        
        observaciones: getValue('observaciones')
    };

    try {
        // 2. Guardar en IndexedDB (Capa Local)
        await saveLocal(formData);
        
        // 3. Incrementar contador
        incrementarContador();
        
        // 4. Feedback visual
        alert("REGISTRO GUARDADO LOCALMENTE");
        form.reset();

        // 5. Intentar sincronizar ahora mismo
        if (typeof syncManager !== 'undefined') {
            syncManager.triggerSync();
        }
        
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error crítico al guardar los datos.");
    }
});

// Detectar tipo de dispositivo
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Móvil";
    return "Desktop";
}

// Actualizar indicador de conexión
function updateOnlineStatus() {
    const statusDot = document.getElementById('online-status');
    const statusText = document.getElementById('status-text');
    
    if (navigator.onLine) {
        if(statusDot) statusDot.className = "h-2 w-2 rounded-full bg-green-600 mr-2";
        if(statusText) statusText.innerText = "Online";
        if (typeof syncManager !== 'undefined') syncManager.triggerSync();
    } else {
        if(statusDot) statusDot.className = "h-2 w-2 rounded-full bg-red-600 mr-2";
        if(statusText) statusText.innerText = "Offline";
        if (typeof syncManager !== 'undefined') syncManager.updateSyncStatus('offline');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();