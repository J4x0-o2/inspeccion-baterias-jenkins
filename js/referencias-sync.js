/**
 * SINCRONIZADOR DE REFERENCIAS (SIMPLIFICADO)
 * Carga referencias del endpoint /api/referencias (hardcodeadas)
 * Las almacena en localStorage para uso offline
 */

const REFERENCIAS_STORAGE_KEY = 'baterias_referencias_cache';

// ========== ALMACENAMIENTO EN CACHE ==========

function guardarReferenciasEnCache(referencias) {
  try {
    localStorage.setItem(REFERENCIAS_STORAGE_KEY, JSON.stringify(referencias));
    console.log(`✅ [Referencias] ${referencias.length} guardadas en caché`);
  } catch (e) {
    console.error('❌ Error guardando referencias en localStorage:', e);
  }
}

function obtenerReferenciasDelCache() {
  try {
    const cached = localStorage.getItem(REFERENCIAS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error('❌ Error al obtener referencias del cache:', e);
    return [];
  }
}

// ========== OBTENER REFERENCIA ESPECÍFICA ==========

function obtenerReferencia(codigo) {
  const cached = obtenerReferenciasDelCache();
  return cached.find(r => r.referencia === codigo);
}

// ========== CARGAR REFERENCIAS ==========

async function cargarReferencias() {
  try {
    console.log('[📡] Cargando referencias...');
    
    const response = await fetch('/api/referencias', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const referencias = data.referencias || [];

    if (Array.isArray(referencias) && referencias.length > 0) {
      guardarReferenciasEnCache(referencias);
      actualizarSelectReferencias(referencias);
      console.log(`✅ [Referencias] ${referencias.length} cargadas`);
      return referencias;
    } else {
      throw new Error('Sin referencias en respuesta');
    }
  } catch (error) {
    console.warn(`⚠️ [Referencias] Error: ${error.message}`);
    
    // Fallback: usar caché local
    const cached = obtenerReferenciasDelCache();
    if (cached.length > 0) {
      console.log(`✅ [Referencias] ${cached.length} cargadas del caché (FALLBACK)`);
      actualizarSelectReferencias(cached);
      return cached;
    } else {
      console.error('❌ [Referencias] Sin referencias disponibles');
      return [];
    }
  }
}

// ========== ACTUALIZAR DROPDOWN ==========

function actualizarSelectReferencias(referencias) {
  const select = document.getElementById('refBateria');
  if (!select) {
    console.warn('⚠️ Select #refBateria no encontrado');
    return;
  }

  // Limpiar opciones
  while (select.options.length > 1) {
    select.remove(1);
  }

  if (referencias.length === 0) {
    select.options[0].text = '-- Sin referencias disponibles --';
    return;
  }

  select.options[0].text = '-- Seleccionar referencia --';

  // Agregar referencias
  referencias.forEach(ref => {
    const option = document.createElement('option');
    option.value = ref.referencia;
    option.text = ref.referencia;
    option.dataset.cargaMin = ref.cargaMin || '';
    option.dataset.cargaMax = ref.cargaMax || '';
    option.dataset.pesoMin = ref.pesoMin || '';
    option.dataset.pesoMax = ref.pesoMax || '';
    select.appendChild(option);
  });

  // ========== EVENT LISTENER PARA VALIDACIÓN DINÁMICA ==========
  // Cuando cambia la referencia, revalidar carga y peso
  select.addEventListener('change', () => {
    if (typeof validarCargaDinamica === 'function') {
      validarCargaDinamica();
    }
    if (typeof validarPesoDinamica === 'function') {
      validarPesoDinamica();
    }
  });
}

// ========== INICIALIZAR AL CARGAR ==========

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cargarReferencias();
  });
} else {
  cargarReferencias();
}
