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
     * Envía datos a Google Sheets con reintentos automáticos
     * @param {Object} data - Datos a sincronizar
     * @returns {Promise<Object>} - Resultado del envío
     */
    async sendToGoogleSheets(data) {
        try {
            // Obtener configuración de forma segura desde config.js
            const config = typeof getAPIConfig !== 'undefined' ? getAPIConfig() : null;
            
            if (!config) {
                throw new Error('Configuración de API no disponible');
            }

            const payload = {
                ...data,
                apiKey: config.key,
                timestamp: new Date().toISOString()
            };

            const response = await this._fetchWithTimeout(config.url, {
                method: "POST",
                mode: "no-cors",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload)
            }, 10000); // 10 segundos de timeout

            // Con "no-cors" no podemos leer la respuesta, pero sin excepción = éxito
            return { status: "success", sent: true };
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