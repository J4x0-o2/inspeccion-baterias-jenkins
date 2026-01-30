// Este archivo maneja la lógica del formulario, captura datos de baterías, los guarda localmente en IndexedDB y sincroniza con Google Sheets cuando hay conexión.

const form = document.getElementById('battery-form');

// ============ GESTIÓN DEL CONTADOR ============
const CONTADOR_KEY = 'baterias_registradas_contador';
const HISTORIAL_CONTADORES_KEY = 'baterias_historial_contadores';

// Función para obtener el contador actual
function obtenerContador() {
    const contador = localStorage.getItem(CONTADOR_KEY);
    return contador ? parseInt(contador) : 0;
}

// Función para actualizar el contador en localStorage y en la UI
function actualizarContador(nuevoValor) {
    localStorage.setItem(CONTADOR_KEY, nuevoValor);
    const display = document.getElementById('contador-display');
    if (display) {
        display.textContent = nuevoValor;
    }
}

// Función para incrementar el contador
function incrementarContador() {
    const contador = obtenerContador();
    actualizarContador(contador + 1);
}

// Función para guardar historial de contadores reiniciados
function guardarEnHistorial(contadorAnterior, fechaReinicio) {
    let historial = [];
    const historialStr = localStorage.getItem(HISTORIAL_CONTADORES_KEY);
    
    if (historialStr) {
        try {
            historial = JSON.parse(historialStr);
        } catch (e) {
            historial = [];
        }
    }
    
    historial.push({
        contador: contadorAnterior,
        fecha: fechaReinicio,
        timestamp: new Date(fechaReinicio).getTime()
    });
    
    localStorage.setItem(HISTORIAL_CONTADORES_KEY, JSON.stringify(historial));
}

// Función para reiniciar el contador automáticamente
function reiniciarContadorAutomatico() {
    const contadorActual = obtenerContador();
    const ahora = new Date().toISOString();
    
    // Guardar en historial el contador anterior
    guardarEnHistorial(contadorActual, ahora);
    
    // Reiniciar a 0
    actualizarContador(0);
    
    // Mostrar notificación
    mostrarNotificacion('Contador reiniciado');
    
    console.log(`[Auto-Reinicio] Contador anterior: ${contadorActual}, Nuevo contador: 0`);
}

// Función para mostrar notificación silenciosa
function mostrarNotificacion(mensaje) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] animate-pulse';
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    // Remover después de 4 segundos
    setTimeout(() => {
        notificacion.remove();
    }, 4000);
}

// Función para reiniciar el contador manualmente (solo si el usuario lo solicita)
function reiniciarContador() {
    if (confirm('¿Estás seguro de que deseas reiniciar el contador? Se perderán los datos del contador actual.')) {
        reiniciarContadorAutomatico();
    }
}

// Cargar el contador cuando se carga la página
function cargarContador() {
    const contador = obtenerContador();
    const display = document.getElementById('contador-display');
    if (display) {
        display.textContent = contador;
    }
}

// Agregar evento al botón de reinicio
document.getElementById('reset-contador').addEventListener('click', reiniciarContador);

// Cargar el contador al iniciar
cargarContador();

// ============ REFERENCIAS DINÁMICAS ==========
// Las referencias se cargan desde Google Sheets en referencias-sync.js
// No hay referencias hardcodeadas aquí


// Función para calcular días entre dos fechas
function calcularDias() {
    const fechaInspeccion = document.getElementById('fechaInspeccion').value;
    const fechaRecarga = document.getElementById('fechaRecarga').value;
    const diasInput = document.getElementById('dias');
    
    if (fechaInspeccion && fechaRecarga) {
        const fecha1 = new Date(fechaInspeccion);
        const fecha2 = new Date(fechaRecarga);
        
        // Calcular la diferencia en milisegundos
        const diferencia = Math.abs(fecha2 - fecha1);
        
        // Convertir a días
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        
        diasInput.value = dias;
        
        // Marcar en rojo si es >= 21 días
        if (dias >= 21) {
            diasInput.classList.add('bg-red-200', 'border-red-500');
            diasInput.classList.remove('bg-gray-100');
        } else {
            diasInput.classList.remove('bg-red-200', 'border-red-500');
            diasInput.classList.add('bg-gray-100');
        }
    } else {
        diasInput.value = '';
        diasInput.classList.remove('bg-red-200', 'border-red-500');
        diasInput.classList.add('bg-gray-100');
    }
}

// Rango de peso válido por referencia de batería
const pesoRanges = {
    '244105506R': { min: 14.80, max: 16.10, label: '14,80kg - 16,10kg' },
    '244103318R': { min: 16.55, max: 17.97, label: '16,55kg - 17,97kg' }
};

// Rango de voltaje válido por referencia de batería
const voltajeRanges = {
    '244105506R': { min: 12.70, max: 12.95, label: '12,70V - 12,95V' },
    '244103318R': { min: 12.70, max: 13.00, label: '12,70V - 13,00V' }
};

// ========== VALIDACIÓN DINÁMICA BASADA EN GOOGLE SHEETS ==========

function validarCargaDinamica() {
    const refBateria = document.getElementById('refBateria').value;
    const cargaInput = document.getElementById('carga');
    const cargaAlert = document.getElementById('carga-alert');
    const cargaAlertText = document.getElementById('carga-alert-text');
    const carga = parseFloat(cargaInput.value);
    
    if (!carga || isNaN(carga)) {
        cargaInput.classList.remove('bg-red-200', 'border-red-500');
        cargaAlert.classList.add('hidden');
        return;
    }
    
    // Obtener referencia del cache con rangos de Google Sheets
    const referencia = obtenerReferencia(refBateria);
    
    if (referencia && referencia.cargaMin && referencia.cargaMax) {
        const min = parseFloat(referencia.cargaMin);
        const max = parseFloat(referencia.cargaMax);
        
        if (carga < min || carga > max) {
            cargaInput.classList.add('bg-red-200', 'border-red-500');
            cargaAlertText.textContent = `Mínimo: ${min}V | Máximo: ${max}V | Actual: ${carga}V`;
            cargaAlert.classList.remove('hidden');
            console.log(`⚠️ Carga fuera de rango: ${carga}V (válido: ${min}V - ${max}V)`);
        } else {
            cargaInput.classList.remove('bg-red-200', 'border-red-500');
            cargaAlert.classList.add('hidden');
        }
    } else {
        // Si no hay rangos en Sheets, usar los hardcodeados (fallback)
        const range = voltajeRanges[refBateria];
        if (range && (carga < range.min || carga > range.max)) {
            cargaInput.classList.add('bg-red-200', 'border-red-500');
            cargaAlertText.textContent = `Rango: ${range.label} | Actual: ${carga}V`;
            cargaAlert.classList.remove('hidden');
        } else {
            cargaInput.classList.remove('bg-red-200', 'border-red-500');
            cargaAlert.classList.add('hidden');
        }
    }
}

function validarPesoDinamica() {
    const refBateria = document.getElementById('refBateria').value;
    const pesoInput = document.getElementById('peso');
    const pesoAlert = document.getElementById('peso-alert');
    const pesoAlertText = document.getElementById('peso-alert-text');
    const peso = parseFloat(pesoInput.value);
    
    if (!peso || isNaN(peso)) {
        pesoInput.classList.remove('bg-red-200', 'border-red-500');
        pesoAlert.classList.add('hidden');
        return;
    }
    
    // Obtener referencia del cache con rangos de Google Sheets
    const referencia = obtenerReferencia(refBateria);
    
    if (referencia && referencia.pesoMin && referencia.pesoMax) {
        const min = parseFloat(referencia.pesoMin);
        const max = parseFloat(referencia.pesoMax);
        
        if (peso < min || peso > max) {
            pesoInput.classList.add('bg-red-200', 'border-red-500');
            pesoAlertText.textContent = `Mínimo: ${min}kg | Máximo: ${max}kg | Actual: ${peso}kg`;
            pesoAlert.classList.remove('hidden');
            console.log(`⚠️ Peso fuera de rango: ${peso}kg (válido: ${min}kg - ${max}kg)`);
        } else {
            pesoInput.classList.remove('bg-red-200', 'border-red-500');
            pesoAlert.classList.add('hidden');
        }
    } else {
        // Si no hay rangos en Sheets, usar los hardcodeados (fallback)
        const range = pesoRanges[refBateria];
        if (range && (peso < range.min || peso > range.max)) {
            pesoInput.classList.add('bg-red-200', 'border-red-500');
            pesoAlertText.textContent = `Rango: ${range.label} | Actual: ${peso}kg`;
            pesoAlert.classList.remove('hidden');
        } else {
            pesoInput.classList.remove('bg-red-200', 'border-red-500');
            pesoAlert.classList.add('hidden');
        }
    }
}

// Función para calcular días entre dos fechas
function calcularDias() {
    const fechaInspeccion = document.getElementById('fechaInspeccion').value;
    const fechaRecarga = document.getElementById('fechaRecarga').value;
    const diasInput = document.getElementById('dias');
    
    if (fechaInspeccion && fechaRecarga) {
        const fecha1 = new Date(fechaInspeccion);
        const fecha2 = new Date(fechaRecarga);
        
        // Calcular la diferencia en milisegundos
        const diferencia = Math.abs(fecha2 - fecha1);
        
        // Convertir a días
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        
        diasInput.value = dias;
        
        // Marcar en rojo si es >= 21 días
        if (dias >= 21) {
            diasInput.classList.add('bg-red-200', 'border-red-500');
            diasInput.classList.remove('bg-gray-100');
        } else {
            diasInput.classList.remove('bg-red-200', 'border-red-500');
            diasInput.classList.add('bg-gray-100');
        }
    } else {
        diasInput.value = '';
        diasInput.classList.remove('bg-red-200', 'border-red-500');
        diasInput.classList.add('bg-gray-100');
    }
}

// Agregar listeners a las fechas para calcular automáticamente
document.getElementById('fechaInspeccion').addEventListener('change', calcularDias);
document.getElementById('fechaRecarga').addEventListener('change', calcularDias);

// Agregar listeners para validar carga y peso (dinámicamente desde Google Sheets)
document.getElementById('refBateria').addEventListener('change', () => {
    validarCargaDinamica();
    validarPesoDinamica();
});
document.getElementById('carga').addEventListener('input', validarCargaDinamica);
document.getElementById('carga').addEventListener('change', validarCargaDinamica);
document.getElementById('peso').addEventListener('input', validarPesoDinamica);
document.getElementById('peso').addEventListener('change', validarPesoDinamica);

// ============ EVENTO SUBMIT DEL FORMULARIO ==========

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // VALIDACIÓN 0: Verificar que hay una referencia configurada
    const configRef = obtenerConfigRef();
    if (!configRef) {
        alert("⚠️ DEBES CONFIGURAR UNA REFERENCIA DE BATERÍA PRIMERO\n\nHaz clic en el botón '⚙️ Referencia' en la barra superior.");
        abrirModalConfigRef();
        return;
    }

    // Función auxiliar para obtener valores de forma segura
    const getValue = (id) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`Error: No se encontró el elemento con ID: ${id}`);
            return "";
        }
        return el.value;
    };

    // VALIDACIÓN 1: Verificar que hay referencia seleccionada
    const refBateria = getValue('refBateria');
    if (!refBateria || refBateria.trim() === '') {
        alert("⚠️ DEBES SELECCIONAR UNA REFERENCIA DE BATERÍA");
        document.getElementById('refBateria').focus();
        return;
    }

    // VALIDACIÓN 2: Verificar campos requeridos básicos
    const inspector = getValue('inspector');
    const carga = getValue('carga');
    const peso = getValue('peso');
    
    if (!inspector || inspector.trim() === '') {
        alert("⚠️ DEBES INGRESAR EL NOMBRE DEL INSPECTOR");
        document.getElementById('inspector').focus();
        return;
    }
    
    if (!carga || parseFloat(carga) === 0) {
        alert("⚠️ DEBES INGRESAR LA CARGA (VOLTAJE)");
        document.getElementById('carga').focus();
        return;
    }
    
    if (!peso || parseFloat(peso) === 0) {
        alert("⚠️ DEBES INGRESAR EL PESO");
        document.getElementById('peso').focus();
        return;
    }

    // 1. Capturar todos los datos
    const formData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        deviceType: getDeviceType(),
        
        // Datos principales para Google Sheets
        refBateria: refBateria,
        inspector: inspector,
        fechaInspeccion: getValue('fechaInspeccion'),
        fechaFabricacion: getValue('fechaFabricacion'),
        fechaRecarga: getValue('fechaRecarga'),
        
        // Inspección visual
        bornes: getValue('bornes'),
        calcomanias: getValue('calcomanias'),
        tapones: getValue('tapones'),
        fugas: getValue('fugas'),
        aspectoGeneral: getValue('aspectoGeneral'),
        
        // Medidas técnicas
        carga: parseFloat(carga) ?? 0,
        peso: parseFloat(peso) ?? 0,
        formula: parseInt(getValue('formula')) ?? 0,
        dias: parseInt(getValue('dias')) ?? 0,
        
        // Observaciones
        observaciones: getValue('observaciones'),
        
        // Formato simplificado para Google Sheets
        fecha: getValue('fechaInspeccion'),
        estado: 'Pendiente'
    };

    try {
        // 2. Guardar en IndexedDB (Capa Local)
        await saveLocal(formData);
        
        // 3. Incrementar contador
        incrementarContador();
        
        // 4. Mostrar registros pendientes
        const pendientes = await getAllPending();
        if (pendientes && pendientes.length > 0) {
            if (typeof syncManager !== 'undefined') {
                syncManager.showSyncQueue(pendientes.length);
            }
        }
        
        // 5. Feedback visual
        alert("✅ REGISTRO GUARDADO LOCALMENTE");
        form.reset();

        // 6. Intentar sincronizar ahora mismo
        if (typeof syncManager !== 'undefined') {
            syncManager.triggerSync();
        }
        
    } catch (err) {
        console.error("Error al guardar:", err);
        alert("Error crítico al guardar los datos.");
    }
});

// Detectar tipo de dispositivo
function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "Tablet";
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "Móvil";
    return "Desktop";
}

// Actualizar indicador de conexión
function updateOnlineStatus() {
    const statusDot = document.getElementById('online-status');
    const statusText = document.getElementById('status-text');
    
    if (navigator.onLine) {
        if(statusDot) statusDot.className = "h-2 w-2 rounded-full bg-green-600 mr-2";
        if(statusText) statusText.innerText = "Online";
        if (typeof syncManager !== 'undefined') syncManager.triggerSync();
    } else {
        if(statusDot) statusDot.className = "h-2 w-2 rounded-full bg-red-600 mr-2";
        if(statusText) statusText.innerText = "Offline";
        if (typeof syncManager !== 'undefined') syncManager.updateSyncStatus('offline');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// ============ MODAL PARA AGREGAR NUEVAS REFERENCIAS ============

function abrirModalNuevaRef() {
  const modal = document.getElementById('modal-nueva-ref');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('modal-ref-codigo')?.focus();
  }
}

function cerrarModalNuevaRef() {
  const modal = document.getElementById('modal-nueva-ref');
  if (modal) {
    modal.classList.add('hidden');
    // Limpiar formulario
    document.getElementById('modal-ref-codigo').value = '';
    document.getElementById('modal-ref-carga-min').value = '';
    document.getElementById('modal-ref-carga-max').value = '';
    document.getElementById('modal-ref-peso-min').value = '';
    document.getElementById('modal-ref-peso-max').value = '';
    document.getElementById('modal-ref-error').classList.add('hidden');
  }
}

function ocultarErrorModal() {
  const error = document.getElementById('modal-ref-error');
  if (error) {
    error.classList.add('hidden');
  }
}

function mostrarErrorModal(mensaje) {
  const error = document.getElementById('modal-ref-error');
  const errorMsg = document.getElementById('modal-ref-error-msg');
  if (error && errorMsg) {
    errorMsg.textContent = mensaje;
    error.classList.remove('hidden');
  }
}

function guardarNuevaRef() {
  ocultarErrorModal();

  const codigo = document.getElementById('modal-ref-codigo').value.trim().toUpperCase();
  const cargaMin = parseFloat(document.getElementById('modal-ref-carga-min').value);
  const cargaMax = parseFloat(document.getElementById('modal-ref-carga-max').value);
  const pesoMin = parseFloat(document.getElementById('modal-ref-peso-min').value);
  const pesoMax = parseFloat(document.getElementById('modal-ref-peso-max').value);

  // Validaciones básicas
  if (!codigo) {
    mostrarErrorModal('El código de referencia es requerido');
    return;
  }

  if (isNaN(cargaMin) || isNaN(cargaMax)) {
    mostrarErrorModal('Los valores de carga deben ser números válidos');
    return;
  }

  if (isNaN(pesoMin) || isNaN(pesoMax)) {
    mostrarErrorModal('Los valores de peso deben ser números válidos');
    return;
  }

  // Llamar a la función de referencias-sync.js
  const resultado = agregarReferencia({
    referencia: codigo,
    cargaMin,
    cargaMax,
    pesoMin,
    pesoMax
  });

  if (resultado.ok) {
    mostrarNotificacion(`✅ Referencia "${codigo}" agregada correctamente`);
    cerrarModalNuevaRef();
  } else {
    mostrarErrorModal(resultado.error || 'Error al agregar la referencia');
  }
}

// Event Listeners para el modal
document.addEventListener('DOMContentLoaded', () => {
  // Botón para abrir modal
  const btnAgregarRef = document.getElementById('btn-agregar-ref');
  if (btnAgregarRef) {
    btnAgregarRef.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalNuevaRef();
    });
  }

  // Botones para cerrar modal
  const botonesClose = document.querySelectorAll('.btn-close-modal');
  botonesClose.forEach(btn => {
    btn.addEventListener('click', cerrarModalNuevaRef);
  });

  // Botón guardar
  const btnGuardar = document.getElementById('modal-ref-guardar');
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarNuevaRef);
  }

  // Permitir Enter en los campos de input
  const modalInputs = [
    'modal-ref-codigo',
    'modal-ref-carga-min',
    'modal-ref-carga-max',
    'modal-ref-peso-min',
    'modal-ref-peso-max'
  ];

  modalInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          guardarNuevaRef();
        }
      });
    }
  });

  // Cerrar modal al hacer click fuera
  const modal = document.getElementById('modal-nueva-ref');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModalNuevaRef();
      }
    });
  }
});

// ============ GESTIÓN DE CONFIGURACIÓN DE REFERENCIA ============

// ✅ Nota: Los storage keys se centralizan ahora en config.js:
// - REFERENCIAS_STORAGE_KEY: Caché de referencias base
// - CUSTOM_REFERENCIAS_KEY: Referencias creadas por usuario
// - CONFIG_REF_KEY: Referencia actualmente configurada

// Estructura para almacenar la referencia configurada:
// {
//   codigo: "244105506R",
//   cargaMin: 12.7,
//   cargaMax: 12.95,
//   pesoMin: 14.8,
//   pesoMax: 16.1
// }

function guardarConfigRef(config) {
  try {
    localStorage.setItem(CONFIG_REF_KEY, JSON.stringify(config));
    console.log(`✅ Configuración de referencia guardada: ${config.codigo}`);
  } catch (e) {
    console.error('❌ Error guardando configuración de referencia:', e);
  }
}

function obtenerConfigRef() {
  try {
    const config = localStorage.getItem(CONFIG_REF_KEY);
    return config ? JSON.parse(config) : null;
  } catch (e) {
    console.error('❌ Error obteniendo configuración de referencia:', e);
    return null;
  }
}

function limpiarConfigRef() {
  try {
    localStorage.removeItem(CONFIG_REF_KEY);
    console.log('✅ Configuración de referencia limpiada');
  } catch (e) {
    console.error('❌ Error limpiando configuración de referencia:', e);
  }
}

// ========== FUNCIÓN AUXILIAR: CONSTRUIR SELECT DE REFERENCIAS ==========
function construirSelectReferencias(selectEl) {
  // Limpiar opciones previas (excepto la primera)
  while (selectEl.options.length > 1) {
    selectEl.remove(1);
  }
  // Limpiar optgroups
  const optgroups = selectEl.querySelectorAll('optgroup');
  optgroups.forEach(og => og.remove());

  // Agregar referencias base
  const base = obtenerReferenciasDelCache();
  base.forEach(ref => {
    const option = document.createElement('option');
    option.value = ref.referencia;
    option.text = ref.referencia;
    option.dataset.cargaMin = ref.cargaMin || '';
    option.dataset.cargaMax = ref.cargaMax || '';
    option.dataset.pesoMin = ref.pesoMin || '';
    option.dataset.pesoMax = ref.pesoMax || '';
    selectEl.appendChild(option);
  });

  // Agregar separador si hay referencias creadas
  const custom = obtenerReferenciasCustom();
  if (custom.length > 0) {
    const separator = document.createElement('optgroup');
    separator.label = '─── Referencias Creadas ───';
    selectEl.appendChild(separator);

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
}

function abrirModalConfigRef() {
  const modal = document.getElementById('modal-config-ref');
  if (modal) {
    modal.classList.remove('hidden');
    const selectRef = document.getElementById('config-ref-select');
    construirSelectReferencias(selectRef);
    actualizarUIModalConfigRef();
  }
}

function cerrarModalConfigRef() {
  const modal = document.getElementById('modal-config-ref');
  if (modal) {
    modal.classList.add('hidden');
    ocultarErrorConfigRef();
    ocultarFormularioNuevaRefConfig();
  }
}

function ocultarErrorConfigRef() {
  const error = document.getElementById('config-ref-error');
  if (error) {
    error.classList.add('hidden');
  }
}

function mostrarErrorConfigRef(mensaje) {
  const error = document.getElementById('config-ref-error');
  const errorMsg = document.getElementById('config-ref-error-msg');
  if (error && errorMsg) {
    errorMsg.textContent = mensaje;
    error.classList.remove('hidden');
  }
}

function mostrarFormularioNuevaRefConfig() {
  const form = document.getElementById('config-ref-nueva-form');
  if (form) {
    form.classList.remove('hidden');
    document.getElementById('config-ref-codigo')?.focus();
  }
}

function ocultarFormularioNuevaRefConfig() {
  const form = document.getElementById('config-ref-nueva-form');
  if (form) {
    form.classList.add('hidden');
    // Limpiar formulario
    document.getElementById('config-ref-codigo').value = '';
    document.getElementById('config-ref-carga-min-new').value = '';
    document.getElementById('config-ref-carga-max-new').value = '';
    document.getElementById('config-ref-peso-min-new').value = '';
    document.getElementById('config-ref-peso-max-new').value = '';
  }
}

function actualizarUIModalConfigRef() {
  const config = obtenerConfigRef();
  const selectRef = document.getElementById('config-ref-select');
  const paramsSection = document.getElementById('config-params-section');
  const actualSection = document.getElementById('config-ref-actual');
  const btnConfirmar = document.getElementById('config-ref-confirmar');

  if (config) {
    // Mostrar sección de parámetros si hay configuración
    paramsSection.classList.remove('hidden');
    actualSection.classList.remove('hidden');
    
    // Llenar inputs con valores actuales
    document.getElementById('config-carga-min').value = config.cargaMin;
    document.getElementById('config-carga-max').value = config.cargaMax;
    document.getElementById('config-peso-min').value = config.pesoMin;
    document.getElementById('config-peso-max').value = config.pesoMax;
    
    // Mostrar referencia actual
    document.getElementById('config-ref-actual-codigo').textContent = config.codigo;
    document.getElementById('config-ref-actual-carga').textContent = `${config.cargaMin} - ${config.cargaMax}`;
    document.getElementById('config-ref-actual-peso').textContent = `${config.pesoMin} - ${config.pesoMax}`;
    
    // Seleccionar en el dropdown
    selectRef.value = config.codigo;
    btnConfirmar.disabled = false;
  } else {
    paramsSection.classList.add('hidden');
    actualSection.classList.add('hidden');
    btnConfirmar.disabled = true;
  }
}

function seleccionarReferenciaConfig() {
  ocultarErrorConfigRef();
  const selectRef = document.getElementById('config-ref-select');
  const codigo = selectRef.value;

  if (!codigo) {
    mostrarErrorConfigRef('Debes seleccionar una referencia');
    return;
  }

  // Obtener la referencia completa
  const referencia = obtenerReferencia(codigo);
  if (!referencia) {
    mostrarErrorConfigRef('Referencia no encontrada');
    return;
  }

  // Llenar inputs con los valores de la referencia
  document.getElementById('config-carga-min').value = referencia.cargaMin || '';
  document.getElementById('config-carga-max').value = referencia.cargaMax || '';
  document.getElementById('config-peso-min').value = referencia.pesoMin || '';
  document.getElementById('config-peso-max').value = referencia.pesoMax || '';

  // Mostrar sección de parámetros
  document.getElementById('config-params-section').classList.remove('hidden');
  document.getElementById('config-ref-actual').classList.add('hidden');
  document.getElementById('config-ref-confirmar').disabled = false;

  ocultarFormularioNuevaRefConfig();
}

function crearNuevaReferenciaConfig() {
  ocultarErrorConfigRef();

  const codigo = document.getElementById('config-ref-codigo').value.trim().toUpperCase();
  const cargaMin = parseFloat(document.getElementById('config-ref-carga-min-new').value);
  const cargaMax = parseFloat(document.getElementById('config-ref-carga-max-new').value);
  const pesoMin = parseFloat(document.getElementById('config-ref-peso-min-new').value);
  const pesoMax = parseFloat(document.getElementById('config-ref-peso-max-new').value);

  // Validaciones
  if (!codigo) {
    mostrarErrorConfigRef('El código de referencia es requerido');
    return;
  }

  if (isNaN(cargaMin) || isNaN(cargaMax)) {
    mostrarErrorConfigRef('Los valores de carga deben ser números válidos');
    return;
  }

  if (isNaN(pesoMin) || isNaN(pesoMax)) {
    mostrarErrorConfigRef('Los valores de peso deben ser números válidos');
    return;
  }

  // Crear referencia usando la función de referencias-sync.js
  const resultado = agregarReferencia({
    referencia: codigo,
    cargaMin,
    cargaMax,
    pesoMin,
    pesoMax
  });

  if (resultado.ok) {
    // Actualizar el select usando la función centralizada
    const selectRef = document.getElementById('config-ref-select');
    construirSelectReferencias(selectRef);
    
    // Seleccionar la nueva referencia
    selectRef.value = codigo;
    
    // Mostrar la sección de parámetros
    const referencia = obtenerReferencia(codigo);
    if (referencia) {
      document.getElementById('config-carga-min').value = referencia.cargaMin || '';
      document.getElementById('config-carga-max').value = referencia.cargaMax || '';
      document.getElementById('config-peso-min').value = referencia.pesoMin || '';
      document.getElementById('config-peso-max').value = referencia.pesoMax || '';
      document.getElementById('config-params-section').classList.remove('hidden');
      document.getElementById('config-ref-actual').classList.add('hidden');
      document.getElementById('config-ref-confirmar').disabled = false;
    }
    
    ocultarFormularioNuevaRefConfig();
    mostrarNotificacion(`✅ Referencia "${codigo}" creada`);
  } else {
    mostrarErrorConfigRef(resultado.error || 'Error al crear la referencia');
  }
}

function confirmarConfigRef() {
  ocultarErrorConfigRef();

  const selectRef = document.getElementById('config-ref-select');
  const codigo = selectRef.value;

  if (!codigo) {
    mostrarErrorConfigRef('Debes seleccionar una referencia');
    return;
  }

  const cargaMin = parseFloat(document.getElementById('config-carga-min').value);
  const cargaMax = parseFloat(document.getElementById('config-carga-max').value);
  const pesoMin = parseFloat(document.getElementById('config-peso-min').value);
  const pesoMax = parseFloat(document.getElementById('config-peso-max').value);

  // Validaciones
  if (isNaN(cargaMin) || isNaN(cargaMax) || isNaN(pesoMin) || isNaN(pesoMax)) {
    mostrarErrorConfigRef('Todos los parámetros deben ser números válidos');
    return;
  }

  if (cargaMin >= cargaMax) {
    mostrarErrorConfigRef('Carga mínima debe ser menor que máxima');
    return;
  }

  if (pesoMin >= pesoMax) {
    mostrarErrorConfigRef('Peso mínimo debe ser menor que máximo');
    return;
  }

  // Guardar configuración
  const config = {
    codigo,
    cargaMin,
    cargaMax,
    pesoMin,
    pesoMax,
    timestamp: new Date().toISOString()
  };

  guardarConfigRef(config);
  
  // Seleccionar automáticamente la referencia en el formulario
  document.getElementById('refBateria').value = codigo;
  
  mostrarNotificacion(`✅ Referencia "${codigo}" configurada correctamente`);
  cerrarModalConfigRef();
  actualizarBotonesConfigRef();
}

function actualizarBotonesConfigRef() {
  const config = obtenerConfigRef();
  const btnConfig = document.getElementById('btn-config-ref');
  
  if (config) {
    btnConfig.textContent = `⚙️ ${config.codigo}`;
    btnConfig.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
    btnConfig.classList.add('bg-green-600', 'hover:bg-green-700');
  } else {
    btnConfig.textContent = '⚙️ Referencia';
    btnConfig.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
    btnConfig.classList.remove('bg-green-600', 'hover:bg-green-700');
  }
}

// Event Listeners para el modal de configuración de referencia
document.addEventListener('DOMContentLoaded', () => {
  // Botón para abrir modal de configuración
  const btnConfigRef = document.getElementById('btn-config-ref');
  if (btnConfigRef) {
    btnConfigRef.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalConfigRef();
    });
  }

  // Select de referencia en el modal
  const selectRef = document.getElementById('config-ref-select');
  if (selectRef) {
    selectRef.addEventListener('change', seleccionarReferenciaConfig);
  }

  // Botón para mostrar formulario de nueva referencia
  const btnNuevaRef = document.getElementById('config-ref-nuevo');
  if (btnNuevaRef) {
    btnNuevaRef.addEventListener('click', mostrarFormularioNuevaRefConfig);
  }

  // Botón para crear nueva referencia
  const btnCrearRef = document.getElementById('config-ref-crear');
  if (btnCrearRef) {
    btnCrearRef.addEventListener('click', crearNuevaReferenciaConfig);
  }

  // Permitir Enter en campos de nueva referencia
  const newRefInputs = [
    'config-ref-codigo',
    'config-ref-carga-min-new',
    'config-ref-carga-max-new',
    'config-ref-peso-min-new',
    'config-ref-peso-max-new'
  ];

  newRefInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          crearNuevaReferenciaConfig();
        }
      });
    }
  });

  // Botón confirmar
  const btnConfirmar = document.getElementById('config-ref-confirmar');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', confirmarConfigRef);
  }

  // Botón cancelar
  const btnCancelar = document.getElementById('config-ref-cancelar');
  if (btnCancelar) {
    btnCancelar.addEventListener('click', cerrarModalConfigRef);
  }

  // Cerrar modal al hacer click fuera
  const modal = document.getElementById('modal-config-ref');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModalConfigRef();
      }
    });
  }

  // Actualizar botón de referencia actual
  actualizarBotonesConfigRef();
});

// Mostrar modal de configuración si no hay referencia configurada al cargar la página
window.addEventListener('load', () => {
  setTimeout(() => {
    const config = obtenerConfigRef();
    if (!config) {
      abrirModalConfigRef();
    }
  }, 2000); // Esperar 2 segundos después de cargar todas las referencias
});
