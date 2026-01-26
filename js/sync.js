// ============================================
// SYNC MODULE - Sincronización automática
// ============================================
// Maneja la sincronización de datos locales con backend de forma robusta

class SyncManager {
    constructor() {
        this.isSyncing = false;
        this.syncQueue = [];
        this.maxRetries = 3;
        this.retryDelay = 2000; // ms
        this.syncInterval = 5 * 60 * 1000; // 5 minutos
        this.lastSyncTime = null;
        this.syncErrors = [];
        
        this.init();
    }

    /**
     * Inicializar listeners de sincronización
     */
    init() {
        // Sincronizar cuando hay conexión
        window.addEventListener('online', () => {
            console.log('[SYNC] Conexión restaurada - iniciando sincronización');
            this.triggerSync();
        });

        // Sincronizar al cargar la página
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.triggerSync());
        } else {
            this.triggerSync();
        }

        // Sincronización periódica automática (cada 5 minutos)
        setInterval(() => this.triggerSync(), this.syncInterval);
    }

    /**
     * Dispara sincronización si es posible
     */
    async triggerSync() {
        if (this.isSyncing || !navigator.onLine) {
            return;
        }

        await this.syncData();
    }

    /**
     * Sincroniza todos los registros pendientes
     */
    async syncData() {
        if (this.isSyncing) {
            console.log('[SYNC] Sincronización ya en progreso');
            return;
        }

        this.isSyncing = true;
        this.updateSyncStatus('sincronizando');

        try {
            const pending = await getAllPending();

            if (pending.length === 0) {
                console.log('[SYNC] No hay registros pendientes');
                this.updateSyncStatus('actualizado');
                this.hideSyncQueue();
                this.isSyncing = false;
                return;
            }

            console.log(`[SYNC] Sincronizando ${pending.length} registros...`);
            this.showSyncQueue(pending.length);

            let successCount = 0;
            let failureCount = 0;

            for (const record of pending) {
                const success = await this.syncRecord(record);
                
                if (success) {
                    successCount++;
                    await deleteLocal(record.id);
                    console.log(`[SYNC] ✓ Registro ${record.id} sincronizado`);
                } else {
                    failureCount++;
                    console.warn(`[SYNC] ✗ Registro ${record.id} falló`);
                }
            }

            this.lastSyncTime = new Date();
            console.log(`[SYNC] Completado: ${successCount} éxito, ${failureCount} fallido`);

            // Si todos se sincronizaron, mostrar estado actualizado
            if (failureCount === 0) {
                this.updateSyncStatus('actualizado');
                this.hideSyncQueue();
            } else {
                this.updateSyncStatus('error');
            }

        } catch (error) {
            console.error('[SYNC] Error durante sincronización:', error);
            this.updateSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sincroniza un registro individual con reintentos
     */
    async syncRecord(record, attempt = 1) {
        try {
            // Verificar conectividad primero
            if (!navigator.onLine) {
                throw new Error('Sin conexión a internet');
            }

            // Usar apiClient si está disponible
            if (typeof apiClient !== 'undefined') {
                const result = await apiClient.sendToGoogleSheets(record);
                return result.sent === true;
            } else {
                console.warn('[SYNC] apiClient no disponible');
                return false;
            }

        } catch (error) {
            console.error(`[SYNC] Intento ${attempt}/${this.maxRetries} falló:`, error.message);

            // Reintentar si no hemos alcanzado el límite
            if (attempt < this.maxRetries) {
                await this.delay(this.retryDelay * attempt); // Backoff exponencial
                return await this.syncRecord(record, attempt + 1);
            }

            // Guardar error para análisis
            this.syncErrors.push({
                recordId: record.id,
                error: error.message,
                timestamp: new Date(),
                attempts: attempt
            });

            return false;
        }
    }

    /**
     * Utilidad: espera el tiempo especificado
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Actualiza el estado visual de sincronización
     */
    updateSyncStatus(status) {
        const statusEl = document.getElementById('sync-status');
        if (!statusEl) return;

        statusEl.className = `sync-status sync-${status}`;

        const messages = {
            'sincronizando': '⟳ Sincronizando...',
            'actualizado': '✓ Datos actualizados',
            'error': '⚠ Error en sincronización',
            'offline': '◯ Modo offline'
        };

        statusEl.textContent = messages[status] || status;
    }

    /**
     * Muestra el contador de registros pendientes
     */
    showSyncQueue(count) {
        const queueEl = document.getElementById('sync-queue-status');
        if (queueEl) {
            queueEl.classList.remove('hidden');
            const countEl = queueEl.querySelector('[data-count]') || queueEl;
            countEl.textContent = `${count} registro${count !== 1 ? 's' : ''} pendiente${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Oculta el contador de registros pendientes
     */
    hideSyncQueue() {
        const queueEl = document.getElementById('sync-queue-status');
        if (queueEl) {
            queueEl.classList.add('hidden');
        }
    }

    /**
     * Obtiene información de diagnóstico
     */
    getDiagnostics() {
        return {
            isSyncing: this.isSyncing,
            lastSyncTime: this.lastSyncTime,
            errorCount: this.syncErrors.length,
            recentErrors: this.syncErrors.slice(-5)
        };
    }
}

// Instancia global del gestor de sincronización
const syncManager = new SyncManager();