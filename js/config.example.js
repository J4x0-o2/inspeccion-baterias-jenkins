// ============================================
// CONFIGURACIÓN TEMPLATE - REEMPLAZA CON TUS VALORES
// ============================================
// IMPORTANTE: Este archivo contiene credenciales sensibles
// NO DEBE ser commiteado al repositorio con valores reales
// Usar variables de entorno en producción

// En desarrollo local:
// 1. Crea una copia: cp js/config.example.js js/config.js
// 2. Rellena con tus credenciales reales
// 3. git add .gitignore (ya ignora config.js)

const API_ENDPOINTS = {
    googleSheets: {
        // URL del Google Apps Script desplegado como Web App
        // Obtenla en: Deploy → New deployment → Web app → Copy URL
        url: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
        
        // API Key para validación en el backend
        // NUNCA debe estar en el código, esta es solo para desarrollo
        // En producción, usar OAuth 2.0 o token en backend
        key: "YOUR_API_KEY_HERE"
    }
};

/**
 * Obtiene la configuración de forma segura
 * SOLO debe ser llamada desde sync.js, no desde la UI
 */
function getAPIConfig() {
    // Validación de desarrollo
    if (!API_ENDPOINTS.googleSheets.url.includes('script.google.com')) {
        console.warn('⚠️ URL de Google Sheets no configurada');
        return null;
    }
    
    if (API_ENDPOINTS.googleSheets.key === 'YOUR_API_KEY_HERE') {
        console.warn('⚠️ API Key no configurada');
        return null;
    }
    
    return API_ENDPOINTS.googleSheets;
}
