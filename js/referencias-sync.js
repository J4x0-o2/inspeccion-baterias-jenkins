/**
 * SINCRONIZADOR DE REFERENCIAS (SIMPLIFICADO)
 * Carga referencias del endpoint /api/referencias (hardcodeadas en código)
 * Las almacena en localStorage para uso offline
 * Permite agregar nuevas referencias dinámicamente
 */

const REFERENCIAS_STORAGE_KEY = 'baterias_referencias_cache';
const CUSTOM_REFERENCIAS_KEY = 'baterias_referencias_custom';

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

// ========== REFERENCIAS PERSONALIZADAS ==========

function obtenerReferenciasCustom() {
  try {
    const custom = localStorage.getItem(CUSTOM_REFERENCIAS_KEY);
    return custom ? JSON.parse(custom) : [];
  } catch (e) {
    console.error('❌ Error al obtener referencias personalizadas:', e);
    return [];
  }
}

function guardarReferenciasCustom(referencias) {
  try {
    localStorage.setItem(CUSTOM_REFERENCIAS_KEY, JSON.stringify(referencias));
    console.log(`✅ [Referencias Custom] ${referencias.length} guardadas`);
  } catch (e) {
    console.error('❌ Error guardando referencias personalizadas:', e);
  }
}

function agregarReferencia(referencia) {
  // Validar que tenga los campos requeridos
  if (!referencia.referencia || referencia.referencia.trim() === '') {
    console.error('❌ [Referencias] Falta el código de referencia');
    return { ok: false, error: 'Código de referencia requerido' };
  }

  if (typeof referencia.cargaMin !== 'number' || typeof referencia.cargaMax !== 'number') {
    console.error('❌ [Referencias] Rango de carga inválido');
    return { ok: false, error: 'Rango de carga inválido' };
  }

  if (typeof referencia.pesoMin !== 'number' || typeof referencia.pesoMax !== 'number') {
    console.error('❌ [Referencias] Rango de peso inválido');
    return { ok: false, error: 'Rango de peso inválido' };
  }

  if (referencia.cargaMin >= referencia.cargaMax) {
    return { ok: false, error: 'Carga mínima debe ser menor que máxima' };
  }

  if (referencia.pesoMin >= referencia.pesoMax) {
    return { ok: false, error: 'Peso mínimo debe ser menor que máximo' };
  }

  // Obtener todas las referencias (base + custom)
  const todas = obtenerTodasLasReferencias();

  // Verificar si ya existe
  if (todas.find(r => r.referencia.toUpperCase() === referencia.referencia.toUpperCase())) {
    return { ok: false, error: 'Esta referencia ya existe' };
  }

  // Agregar a custom
  const custom = obtenerReferenciasCustom();
  const newRef = {
    ...referencia,
    id: `custom_${Date.now()}`,
    referencia: referencia.referencia.toUpperCase().trim(),
    timestamp: new Date().toISOString()
  };

  custom.push(newRef);
  guardarReferenciasCustom(custom);
  actualizarSelectReferencias(obtenerTodasLasReferencias());

  console.log(`✅ [Referencias] Nueva referencia agregada: ${newRef.referencia}`);
  return { ok: true, referencia: newRef };
}

function obtenerTodasLasReferencias() {
  const base = obtenerReferenciasDelCache();
  const custom = obtenerReferenciasCustom();
  return [...base, ...custom];
}

// ========== OBTENER REFERENCIA ESPECÍFICA ==========

function obtenerReferencia(codigo) {
  const todas = obtenerTodasLasReferencias();
  return todas.find(r => r.referencia === codigo);
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
      const todas = obtenerTodasLasReferencias();
      actualizarSelectReferencias(todas);
      console.log(`✅ [Referencias] ${referencias.length} base + ${obtenerReferenciasCustom().length} personalizadas cargadas`);
      return todas;
    } else {
      throw new Error('Sin referencias en respuesta');
    }
  } catch (error) {
    console.warn(`⚠️ [Referencias] Error: ${error.message}`);
    
    // Fallback: usar caché local + custom
    const cached = obtenerReferenciasDelCache();
    const custom = obtenerReferenciasCustom();
    const todas = [...cached, ...custom];
    
    if (todas.length > 0) {
      console.log(`✅ [Referencias] ${cached.length} base + ${custom.length} personalizadas cargadas del caché (FALLBACK)`);
      actualizarSelectReferencias(todas);
      return todas;
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

  // Agregar referencias (base primero, custom después)
  const base = obtenerReferenciasDelCache();
  const custom = obtenerReferenciasCustom();
  
  // Agregar referencias base
  base.forEach(ref => {
    const option = document.createElement('option');
    option.value = ref.referencia;
    option.text = ref.referencia;
    option.dataset.cargaMin = ref.cargaMin || '';
    option.dataset.cargaMax = ref.cargaMax || '';
    option.dataset.pesoMin = ref.pesoMin || '';
    option.dataset.pesoMax = ref.pesoMax || '';
    select.appendChild(option);
  });

  // Agregar separador si hay custom
  if (custom.length > 0) {
    const separator = document.createElement('optgroup');
    separator.label = '─── Referencias Personalizadas ───';
    select.appendChild(separator);

    custom.forEach(ref => {
      const option = document.createElement('option');
      option.value = ref.referencia;
      option.text = `${ref.referencia} (*)`;
      option.dataset.cargaMin = ref.cargaMin || '';
      option.dataset.cargaMax = ref.cargaMax || '';
      option.dataset.pesoMin = ref.pesoMin || '';
      option.dataset.pesoMax = ref.pesoMax || '';
      separator.appendChild(option);
    });
  }

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
