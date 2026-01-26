// ============================================
// CONFIGURACIÓN - Archivo oculto (no commitar credenciales)
// ============================================
// Este archivo contiene credenciales sensibles que NO deben exponerse en la UI
// Se carga solo en el Service Worker y sincronización

const API_ENDPOINTS = {
    googleSheets: {
        url: "https://script.google.com/macros/s/AKfycbyV5epXHNj8tG9CpUbvXHt8AeVRbepZcuCmeqbUn0AxDIJppvZyasqwR71nn6hXLs4D/exec",
        key: "123KKj"
    }
};

// Función para obtener configuración de forma segura (solo desde sync.js)
function getAPIConfig() {
    return API_ENDPOINTS.googleSheets;
}
