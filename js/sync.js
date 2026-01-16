// Este archivo sincroniza automáticamente los datos locales con Google Sheets cuando hay conexión a internet.

let isSyncing = false;

async function syncData() {
    if (isSyncing || !navigator.onLine) return;
    
    const pending = await getAllPending();
    if (pending.length === 0) {
        document.getElementById('sync-queue-status').classList.add('hidden');
        return;
    }

    isSyncing = true;
    console.log(`Sincronizando ${pending.length} registros...`);
    document.getElementById('sync-queue-status').classList.remove('hidden');

    for (const record of pending) {
        const result = await sendToGoogleSheets(record);
        if (result.status === "success") {
            await deleteLocal(record.id);
            console.log(`Registro ${record.id} sincronizado y borrado de local.`);
        }
    }

    isSyncing = false;
    // Volver a chequear si quedan (por si se agregaron nuevos durante el proceso)
    syncData();
}

// Escuchar cambios de conexión - Sincronizar apenas hay internet
window.addEventListener('online', syncData);

// Intentar sincronizar cada 5 minutos automáticamente
setInterval(syncData, 5 * 60 * 1000);

// Intentar sincronizar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncData);
} else {
    syncData();
}