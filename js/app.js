const form = document.getElementById('battery-form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Generar Metadatos e ID Único
    const formData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        deviceType: getDeviceType(),
        refBateria: document.getElementById('refBateria').value,
        fechaInspeccion: document.getElementById('fechaInspeccion').value,
        fechaFabricacion: document.getElementById('fechaFabricacion').value,
        fechaRecarga: document.getElementById('fechaRecarga').value,
        bornes: document.getElementById('bornes').value,
        calcomanias: document.getElementById('calcomanias').value,
        tapones: document.getElementById('tapones').value,
        aspectoGeneral: document.getElementById('aspectoGeneral').value || 'OK',
        fugas: document.getElementById('fugas').value,
        carga: parseFloat(document.getElementById('carga').value),
        peso: parseFloat(document.getElementById('peso').value),
        formula: parseInt(document.getElementById('formula').value),
        dias: parseInt(document.getElementById('dias').value),
        inspector: document.getElementById('inspector').value,
        observaciones: document.getElementById('observaciones').value
    };

    try {
        // 2. Guardar siempre en IndexedDB primero (Offline-First)
        await saveLocal(formData);
        
        // 3. Feedback al usuario
        alert("Inspección guardada localmente.");
        form.reset();

        // 4. Intentar sincronizar inmediatamente
        syncData();
        
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error al guardar los datos.");
    }
});

function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Móvil";
    return "Desktop";
}

// Actualizar indicador de conexión visual
function updateOnlineStatus() {
    const statusDot = document.getElementById('online-status');
    const statusText = document.getElementById('status-text');
    
    if (navigator.onLine) {
        statusDot.className = "h-3 w-3 rounded-full bg-green-400 mr-2";
        statusText.innerText = "Online";
        syncData();
    } else {
        statusDot.className = "h-3 w-3 rounded-full bg-red-500 mr-2";
        statusText.innerText = "Offline";
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus(); // Estado inicial