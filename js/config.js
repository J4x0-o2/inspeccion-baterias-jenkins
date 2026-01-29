// ============================================
// CONFIGURACIÓN GENERAL DE LA APP
// ============================================
// ⚠️ IMPORTANTE: Este archivo se sirve al navegador
// NO incluir credenciales, tokens o datos sensibles aquí
// Las credenciales están en Vercel como Environment Variables

// REFERENCIAS BASE (PÚBLICAS - Info. general de baterías)
const REFERENCIAS_BASE = [
  {
    id: "1",
    referencia: "244105506R",
    cargaMin: 12.7,
    cargaMax: 12.95,
    pesoMin: 14.8,
    pesoMax: 16.1
  },
  {
    id: "2",
    referencia: "244103318R",
    cargaMin: 12.7,
    cargaMax: 13.01,
    pesoMin: 16.55,
    pesoMax: 17.97
  }
];

// Función para obtener referencias base
function getReferenciasBase() {
    return REFERENCIAS_BASE;
}


