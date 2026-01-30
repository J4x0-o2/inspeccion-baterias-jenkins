// ============================================
// API MODULE - Comunicación con backends
// ============================================
// Módulo abstraccionado que separa la lógica de API del resto de la app
// Las credenciales se cargan desde config.js (no expuesto en UI)

class APIClient {
    constructor() {
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // ms
    }

    /**
     * Envía datos a Google Sheets a través de la API
     * @param {Object} data - Datos a sincronizar
     * @returns {Promise<Object>} - Resultado del envío
     */
    async sendToGoogleSheets(data) {
        try {
            // Usar API como proxy (las credenciales están en el servidor)
            const response = await this._fetchWithTimeout('/api/send-to-sheets', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            }, 10000); // 10 segundos de timeout

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            console.log("Datos sincronizados con Google Sheets:", result);
            return { status: "success", sent: true, ...result };
        } catch (error) {
            console.error("Error en envío a Google Sheets:", error.message);
            return { status: "error", message: error.message, sent: false };
        }
    }

    /**
     * Fetch con timeout configurable
     */
    async _fetchWithTimeout(url, options = {}, timeout = 10000) {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    /**
     * Verifica la conectividad a internet
     */
    async checkConnectivity() {
        try {
            const response = await this._fetchWithTimeout(
                'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
                { method: 'HEAD' },
                5000
            );
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Instancia global del cliente API (singleton)
const apiClient = new APIClient();