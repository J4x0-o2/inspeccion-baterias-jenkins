# Guía de Desarrollo

## 🔧 Setup para Desarrollo Local

### 1. Configuración Inicial

```bash
# Clonar repositorio
git clone https://github.com/J4x0-o2/inspeccion-baterias.git
cd inspeccion-baterias

# Instalar dependencias
npm install

# Verificar que todo funciona
npm run dev
```

### 2. Variables de Entorno Local

Para desarrollo, necesitas una URL local de Google Apps Script:

**Opción A: Usar URL de producción (más fácil)**
```bash
# Crear archivo .env.local (NO commitear)
# En el archivo:
VITE_GOOGLE_SHEET_URL=https://script.google.com/macros/s/{TU_DEPLOYMENT_ID}/exec
```

**Opción B: Usar Google Apps Script localmente**
```bash
# Usar apps-script-clasp para desarrollar localmente
npm install -g @google/clasp
clasp login
clasp pull
```

---

## 🏗️ Estructura de Archivos para Desarrollo

### Frontend

```
js/
├── app.js                # 📌 Principal - Inicialización y eventos
├── database.js           # 💾 IndexedDB - Operaciones CRUD
├── sync.js              # 🔄 Sincronización - Manejo online/offline
├── api.js               # 🌐 HTTP - Wrapper de fetch
├── config.js            # ⚙️ Configuración
└── referencias-sync.js  # 📦 Catálogo - Carga de referencias
```

### Backend (Vercel)

```
api/
├── send-to-sheets.js   # POST /api/send-to-sheets
└── referencias.js      # GET /api/referencias
```

---

## 📚 Módulos Principales

### **app.js** - Lógica Principal

```javascript
// Exports principales:
- form                          // Elemento del formulario
- incrementarContador()         // Incrementa contador 24h
- reiniciarContadorAutomatico() // Reset automático
- guardarRegistro(datos)        // Orquesta guardado
- mostrarNotificacion(mensaje)  // UI feedback
```

**Pasos al guardar registro:**
```
1. Validar datos del formulario
2. Preparar objeto de inspección
3. Guardar en IndexedDB (database.js)
4. Incrementar contador (localStorage)
5. Si hay conexión → Sincronizar (sync.js)
6. Mostrar notificación
7. Limpiar formulario
```

---

### **database.js** - IndexedDB

```javascript
// Operaciones disponibles:

// Guardar registro
await guardarEnIndexedDB(registro);

// Obtener registro por ID
const registro = await obtenerDelIndexedDB(id);

// Obtener todos no sincronizados
const pendientes = await obtenerNoSincronizados();

// Marcar como sincronizado
await marcarComoSincronizado(id, timestamp);

// Limpiar Base de datos (dev)
await limpiarIndexedDB();
```

**Estructura IndexedDB:**
```javascript
Database: "battery-app"
Store: "inspections"

Record: {
  id: "uuid",
  refBateria: "BAT-001",
  estadoBateria: "BUENO",
  voltaje: 12.8,
  capacidad: 95,
  temperatura: 25,
  observaciones: "...",
  timestamp: 1704067200000,
  sincronizado: false
}
```

---

### **sync.js** - Sincronización

```javascript
// Detectar cambios de conectividad
window.addEventListener('online', sincronizarPendiente);
window.addEventListener('offline', mostrarModoOffline);

// Función principal
async function sincronizarPendiente() {
  const pendientes = await obtenerNoSincronizados();
  
  for (let registro of pendientes) {
    try {
      // POST a Vercel API
      const response = await fetch('/api/send-to-sheets', {
        method: 'POST',
        body: JSON.stringify(registro)
      });
      
      // Si exitoso → marcar sincronizado
      await marcarComoSincronizado(registro.id);
    } catch (error) {
      console.error('Error sincronizando:', error);
      // Reintentar después
    }
  }
}
```

---

### **api.js** - Llamadas HTTP

```javascript
// Wrapper de fetch con manejo de errores
async function llamarAPI(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error en ${endpoint}:`, error);
    throw error;
  }
}
```

---

### **referencias-sync.js** - Catálogo

```javascript
// Cargar referencias desde Google Sheets
async function cargarReferencias() {
  // 1. Verificar caché local
  const cached = obtenerReferenciasEnCache();
  if (cached && !esExpired(cached)) {
    return cached.datos;
  }
  
  // 2. Si no hay caché → fetch de API
  const referencias = await llamarAPI('/api/referencias');
  
  // 3. Guardar en caché
  guardarReferenciasEnCache(referencias);
  
  // 4. Poblar dropdown
  poblarDropdownReferencias(referencias);
  
  return referencias;
}

// Caché estructura:
{
  datos: [...],
  timestamp: 1704067200000
}
```

---

## 🛠️ Flujo de Desarrollo

### Agregar Nueva Funcionalidad

**Ejemplo: Agregar campo de "Firma" al formulario**

#### 1. Frontend (index.html)
```html
<!-- Agregar input en el formulario -->
<div class="form-group">
  <label for="firma">Firma del Inspector</label>
  <input type="text" id="firma" required />
</div>
```

#### 2. app.js - Capturar datos
```javascript
const form = document.getElementById('battery-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Obtener valor nuevo
  const firma = document.getElementById('firma').value;
  
  const datos = {
    // ... campos existentes
    firma: firma
  };
  
  // Guardar
  await guardarRegistro(datos);
});
```

#### 3. database.js - Almacenar en IndexedDB
```javascript
// Ya está configurado para guardar todo lo que envíes
// Solo necesitas verificar que el record tiene la propiedad
async function guardarEnIndexedDB(registro) {
  // registro.firma ya viene del paso anterior
  // Se guarda automáticamente
}
```

#### 4. api/send-to-sheets.js - Enviar a Google Sheets
```javascript
export default async function handler(req, res) {
  const datos = req.body;
  
  // El campo 'firma' ya viene del cliente
  // Se envía a Google Apps Script
  const response = await fetch(GOOGLE_SHEET_URL, {
    method: 'POST',
    body: JSON.stringify(datos)  // incluye firma
  });
}
```

#### 5. Google Apps Script - Persistir
```javascript
function doPost(e) {
  const datos = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    datos.refBateria,
    // ... otros campos
    datos.firma,  // ✓ Guardar firma en columna
  ]);
}
```

---

## 🧪 Testing

### Test Manual - Flujo Completo

```bash
# 1. Iniciar desarrollo
npm run dev

# 2. Abrir navegador
http://localhost:8888

# 3. Llenar formulario y guardar
# 4. Verificar en IndexedDB (DevTools → Application)
# 5. Verificar en Google Sheets en 2-5 segundos
```

### Test Offline

```bash
# 1. Con app abierta
# 2. DevTools → Network → Offline
# 3. Guardar registro
# 4. Verificar que IndexedDB lo guardó
# 5. Ir online
# 6. Verificar que se sincronizó
```

### Test de Errores

```javascript
// En console (F12)
// Simular error de sincronización
localStorage.setItem('sync_error', 'true');

// Forzar sincronización
window.sync?.sincronizarPendiente();
```

---

## 🐛 Debugging

### DevTools - Recursos Importantes

```
F12 → Application:
  • Service Workers: Estado de sw.js
  • Cache Storage: Ver caché del Service Worker
  • IndexedDB: Ver base de datos local
  • LocalStorage: Ver contador y referencias

F12 → Network:
  • Ver requests a /api/send-to-sheets
  • Ver requests a Google Apps Script
  • Throttle para simular conexión lenta

F12 → Console:
  • Ver logs de app.js, database.js, sync.js
  • Ejecutar funciones manualmente
  • Inspeccionar variables
```

### Logs Importantes

```javascript
// app.js
console.log('[APP] Guardando registro:', datos);

// database.js
console.log('[DB] Registro guardado con ID:', id);

// sync.js
console.log('[SYNC] Iniciando sincronización');
console.log('[SYNC] Registros pendientes:', pendientes.length);

// api.js
console.log('[API] Llamando a:', endpoint);
console.log('[API] Respuesta:', response);
```

---

## 📝 Estándares de Código

### Nomenclatura

```javascript
// Funciones
- camelCase: guardarEnIndexedDB()
- Prefijo con verbo: obtener, guardar, actualizar, sincronizar

// Variables
- camelCase: contadorActual, datosInspection
- const para valores inmutables
- let para valores mutables
- Evitar var

// Comentarios
// Para líneas simples
/* Para bloques
   de código */
```

### Estructura de Archivos

```javascript
// Encabezado de archivo
// ============================================
// ARCHIVO: app.js
// DESCRIPCIÓN: Lógica principal de la aplicación
// ============================================

// Imports
import { guardarEnIndexedDB } from './database.js';

// Constantes
const TIMEOUT = 5000;

// Variables globales
let contadorActual = 0;

// Funciones auxiliares
function helper() { }

// Función principal
async function main() { }

// Event listeners
document.addEventListener('DOMContentLoaded', main);
```

---

## 📦 Agregar Dependencias

```bash
# Ver dependencias actuales
npm list

# Instalar nueva dependencia
npm install nombre-paquete

# Instalar solo para desarrollo
npm install --save-dev nombre-paquete

# Actualizar todas
npm update

# Auditar seguridad
npm audit
npm audit fix
```

---

## 🔄 Flujo Git

### Workflow Típico

```bash
# 1. Crear rama para feature
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios
# Editar archivos...

# 3. Verificar cambios
git status
git diff

# 4. Preparar commit
git add .

# 5. Commit con mensaje descriptivo
git commit -m "feat: agregar campo firma al formulario"

# 6. Push a rama
git push origin feature/nueva-funcionalidad

# 7. Crear Pull Request en GitHub
# Review → Merge a main

# 8. Actualizar local
git checkout main
git pull origin main
```

### Tipos de Commits

```
feat:   Nueva funcionalidad
fix:    Corregir bug
docs:   Cambios en documentación
style:  Formato o estilo de código
refactor: Refactorizar código
test:   Agregar/modificar tests
chore:  Tareas de mantenimiento
```

---

## 🚀 Deployment de Cambios

```bash
# 1. Commit y push a main
git commit -m "fix: corregir contador"
git push origin main

# 2. Vercel auto-deploya desde main
# O hacer deploy manual:
vercel --prod

# 3. Verificar en producción
# https://inspeccion-baterias-xxx.vercel.app

# 4. Si falla, revert:
git revert HEAD
git push origin main
vercel --prod
```

---

## 📊 Monitoreo y Logs

### Logs de Vercel

```bash
# Ver logs en tiempo real
vercel logs inspeccion-baterias

# Ver logs específicos
vercel logs inspeccion-baterias --follow
```

### Logs en Navegador

```javascript
// Todas las acciones deberían loguear:
console.log('[MODULE]', 'Descripción breve', {data});

// Nivel de severidad
console.info('[INFO]', 'Información');
console.warn('[WARN]', 'Advertencia');
console.error('[ERROR]', 'Error crítico');
```

---

## 📚 Referencias

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

