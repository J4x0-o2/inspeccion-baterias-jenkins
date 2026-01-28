# Referencia de Archivos

## 📄 Descripción Detallada de Cada Archivo

---

## 🎨 Archivos Frontend

### `index.html` - Interfaz Principal

**Propósito:** Estructura HTML de la aplicación, UI responsiva

**Componentes Principales:**

1. **Header/Navegación**
   - Título: "Registro de Baterías"
   - Contador de registros (display)
   - Botón de sincronización (si existe)

2. **Splash Screen**
   - Pantalla de carga inicial
   - Ícono animado
   - Mensaje "BATERÍAS - Cargando Sistema..."

3. **Formulario Principal** (battery-form)
   ```html
   Campos:
   - Referencia de Batería (dropdown) → id="referencias"
   - Estado de Batería (select) → id="estadoBateria"
   - Voltaje (input number) → id="voltaje"
   - Capacidad (input number) → id="capacidad"
   - Temperatura (input number) → id="temperatura"
   - Observaciones (textarea) → id="observaciones"
   - Botón Guardar → type="submit"
   ```

4. **Notificaciones**
   - Toast messages al guardar
   - Alertas de error/éxito

**Estilo:** Tailwind CSS (CDN)  
**Tamaño:** ~3KB  
**Dependencias:** Ninguna local  

**Editar cuando:**
- Agregar nuevos campos al formulario
- Cambiar estructura de UI
- Actualizar tema/colores
- Agregar validaciones HTML5

---

### `js/app.js` - Lógica Principal (440 líneas)

**Propósito:** Orquestación principal de la aplicación

**Funciones Principales:**

```javascript
obtenerContador()                    // Obtiene contador de localStorage
actualizarContador(nuevoValor)       // Actualiza contador en UI y storage
incrementarContador()                // Incremente contador (cada registro)
reiniciarContadorAutomatico()        // Reset cada 24 horas
verificarReinicioAutomatico()        // Chequea si pasaron 24h
guardarEnHistorial(...)              // Guarda histórico de contadores
guardarRegistro(datos)               // Función principal de guardado
validarDatos(datos)                  // Valida que todos campos existan
mostrarNotificacion(mensaje)         // Muestra toast de éxito/error
limpiarFormulario()                  // Limpia inputs del form
inicializarApp()                     // Setup inicial
```

**Flujo Principal:**
```javascript
1. DOMContentLoaded → inicializarApp()
2. Form.onsubmit → validarDatos()
3. → guardarEnIndexedDB()
4. → incrementarContador()
5. → Si conexión → sync.sincronizarPendiente()
6. → Notificación usuario
7. → Limpiar formulario
```

**Variables Globales:**
```javascript
const CONTADOR_KEY = 'baterias_registradas_contador'
const ULTIMO_REINICIO_KEY = 'baterias_ultimo_reinicio'
const HISTORIAL_CONTADORES_KEY = 'baterias_historial_contadores'
```

**Event Listeners:**
- `form.onsubmit` → Guardar registro
- Cada 1 minuto → Verificar reinicio automático
- `sync.js` → Sincronización al conectarse

**Tamaño:** ~12KB  
**Editar cuando:**
- Cambiar lógica de validación
- Agregar nuevas reglas de negocio
- Modificar manejo de contador
- Cambiar formato de notificaciones

---

### `js/database.js` - IndexedDB (85 líneas)

**Propósito:** Todas las operaciones de almacenamiento local

**Funciones Principales:**

```javascript
inicializarDB()                      // Abre/crea DB
guardarEnIndexedDB(registro)         // INSERT registro
obtenerDelIndexedDB(id)              // SELECT por ID
obtenerTodosLosRegistros()           // SELECT * (todos)
obtenerNoSincronizados()             // SELECT where sincronizado=false
marcarComoSincronizado(id, ts)       // UPDATE sincronizado=true
limpiarIndexedDB()                   // DELETE * (dev only)
obtenerEstadísticas()                // COUNT registros
```

**Schema IndexedDB:**

```javascript
Database: "battery-app"
Version: 1

ObjectStore: "inspections"
  keyPath: "id" (tipo UUID)
  indexes:
    - timestamp: para ordenar por fecha
    - estado: para filtrar por estado
    - sincronizado: para sincronización

Registro típico:
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  refBateria: "BAT-12V-100AH",
  estadoBateria: "BUENO",
  voltaje: 12.8,
  capacidad: 95.5,
  temperatura: 25.3,
  observaciones: "Batería en buen estado",
  timestamp: 1704067200000,
  sincronizado: false,
  fechaSincronizacion: null,
  usuario: "inspector-001"
}
```

**Transacciones:**
- readonly: Para lecturas
- readwrite: Para escrituras

**Límites:**
- ~50MB por origen
- Recomendado: <1000 registros activos

**Tamaño:** ~3KB  
**Editar cuando:**
- Agregar nuevos campos a registros
- Cambiar estructura IndexedDB
- Agregar nuevos índices
- Optimizar queries

---

### `js/sync.js` - Sincronización (95 líneas)

**Propósito:** Detectar cambios de conectividad y sincronizar datos

**Funciones Principales:**

```javascript
sincronizarPendiente()               // POST pendientes a API
enviarRegistroAAPI(registro)         // Envía un registro
detectarCambioConectividad()         // Escucha online/offline
reintentar(funcion, maxIntentos)     // Lógica de reintento
```

**Event Listeners:**
```javascript
window.addEventListener('online', () => {
  console.log('[SYNC] Conectado - iniciando sincronización');
  sincronizarPendiente();
});

window.addEventListener('offline', () => {
  console.log('[SYNC] Desconectado - modo offline');
  mostrarNotificacion('Modo offline - se guardará localmente');
});
```

**Flujo de Sincronización:**
```
1. Detectar que hay conexión
2. Obtener registros no sincronizados de IndexedDB
3. Para cada registro:
   → POST a /api/send-to-sheets
   → Si éxito → marcar sincronizado
   → Si error → reintentar en 5 segundos
4. Notificar al usuario cuando termine
```

**Reintentos:**
- Máximo 3 intentos por registro
- Delay progresivo: 5s, 10s, 15s
- Si falla → Mantiene en cola para próximo intento

**Tamaño:** ~2.5KB  
**Editar cuando:**
- Cambiar lógica de reintentos
- Agregar más endpoints a sincronizar
- Cambiar estrategia de buffering
- Optimizar para conexiones lentas

---

### `js/api.js` - Wrapper de Fetch (50 líneas)

**Propósito:** Centralizar llamadas HTTP con manejo de errores

**Funciones Principales:**

```javascript
llamarAPI(endpoint, options)         // Wrapper de fetch
construirURL(endpoint)               // Construye URL
parsearRespuesta(response)           // Parsea JSON
manejarError(error)                  // Maneja errores
reintentar(funcion, maxIntentos)     // Reintenta en caso de error
```

**Opciones de Configuración:**

```javascript
await llamarAPI('/api/send-to-sheets', {
  method: 'POST',
  body: { /* datos */ },
  timeout: 5000,
  headers: { 'X-Custom': 'value' }
});
```

**Manejo de Errores:**
- Network error → Offline (manejado por Service Worker)
- 4xx → Error de cliente (validación fallida)
- 5xx → Error de servidor (reintentar)
- Timeout → Reintentar automáticamente

**Tamaño:** ~1.5KB  
**Editar cuando:**
- Agregar autenticación
- Cambiar headers HTTP
- Agregar compresión
- Modificar timeout

---

### `js/config.js` - Configuración (15 líneas)

**Propósito:** Almacenar URLs y configuraciones sensibles

**⚠️ IMPORTANTE - SEGURIDAD:**

Este archivo NO debe exponer credenciales en producción.

```javascript
// NUNCA hacer esto en código:
const API_URL = "https://script.google.com/macros/s/SECRET/exec";

// SIEMPRE usar variables de entorno:
const API_URL = process.env.GOOGLE_SHEET_URL; // Solo en backend
```

**Contenido Actual:**

```javascript
const API_ENDPOINTS = {
    googleSheets: {
        url: "https://script.google.com/...", // ← NO exponer en producción
        key: "123KKj"                          // ← NO exponer en producción
    }
};

function getAPIConfig() {
    return API_ENDPOINTS.googleSheets;
}
```

**En Producción:**
- Esta información viene de Vercel (variables de entorno)
- El cliente nunca conoce la URL real
- Solo hace POST a `/api/send-to-sheets` (local)
- El backend inyecta la URL desde `process.env`

**Tamaño:** <1KB  
**Editar cuando:**
- Actualizar información de desarrollo
- NO editar credenciales (usar Vercel)

---

### `js/referencias-sync.js` - Catálogo (120 líneas)

**Propósito:** Cargar catálogo de referencias de baterías

**Funciones Principales:**

```javascript
cargarReferencias()                  // Carga catálogo completo
obtenerReferenciasEnCache()          // Lee caché local
esReferenciasExpired()               // Chequea si caché es válido
guardarReferenciasEnCache(...)       // Cachea referencias
poblarDropdownReferencias(...)       // Actualiza UI
validarReferenciaActual()            // Valida antes de guardar
```

**Estructura de Caché:**

```javascript
LocalStorage: "referencias_cache"
{
  datos: [
    {
      id: "001",
      nombre: "BAT-12V-100AH",
      especificacion: "12V, 100Ah, Ácido",
      estado: "activo"
    },
    // ... más referencias
  ],
  timestamp: 1704067200000
}

TTL: 24 horas (86400000 ms)
```

**Flujo:**
```
1. App init → cargarReferencias()
2. ¿Cache válido? 
   → SÍ: Usar cache local (instantáneo)
   → NO: Fetch de /api/referencias
3. Poblar dropdown con referencias
4. Usuario selecciona referencia al guardar
5. Se valida que referencia existe
```

**Tamaño:** ~3KB  
**Editar cuando:**
- Cambiar estructura de referencias
- Agregar filtros
- Optimizar búsqueda
- Agregar validación de referencias

---

## ⚙️ Archivos de Configuración

### `manifest.json` - Configuración PWA (25 líneas)

**Propósito:** Define cómo se instala la app en dispositivos

```json
{
  "short_name": "Baterias",
  "name": "Inspección de Baterías",
  "description": "App corporativa para registro...",
  "icons": [
    {
      "src": "./images/battery-icon.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "./images/battery-icon.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any maskable"
    }
  ],
  "start_url": "./index.html",
  "background_color": "#F3F4F6",
  "display": "standalone",
  "scope": "./",
  "theme_color": "#2563eb",
  "orientation": "portrait"
}
```

**Campos Importantes:**
- `display: "standalone"` → Se abre como app nativa
- `start_url` → Página inicial
- `theme_color` → Color de barra de navegación
- `icons` → Para home screen en devices

**Editar cuando:**
- Cambiar nombre/descripción de la app
- Actualizar icono
- Cambiar colores de tema
- Cambiar URL inicial

---

### `vercel.json` - Configuración de Deployment (10 líneas)

**Propósito:** Configurar cómo se deploya en Vercel

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "cleanUrls": true
}
```

**Explicación:**
- `buildCommand: ""` → No hay build (sitio estático)
- `outputDirectory: "."` → Todo en root es output
- `cleanUrls: true` → URLs sin .html

**Variables de Entorno:**
Se configuran en Vercel Dashboard, NO aquí

**Editar cuando:**
- Cambiar estrategia de build
- Agregar rutas especiales
- Configurar redirects
- Agregar headers de seguridad

---

### `package.json` - Dependencias Node.js (25 líneas)

```json
{
  "name": "inspeccion-baterias",
  "version": "1.0.0",
  "description": "PWA para inspección de baterías...",
  "scripts": {
    "dev": "netlify dev",
    "build": "echo 'Static site - no build needed'",
    "deploy": "netlify deploy --prod"
  },
  "dependencies": {
    "node-fetch": "^3.3.0"
  },
  "devDependencies": {
    "netlify-cli": "^17.0.0"
  }
}
```

**Dependencias:**
- `node-fetch` → Para fetch en Node.js (backend)
- `netlify-cli` → Para desarrollo local

**Scripts:**
- `npm run dev` → Inicia servidor local
- `npm run build` → Build (no requerido)
- `npm run deploy` → Deploy a producción

**Editar cuando:**
- Agregar nuevas dependencias
- Actualizar versiones
- Cambiar scripts de build
- Agregar dev dependencies

---

## 🔗 Archivos de API (Backend)

### `api/send-to-sheets.js` - POST a Google Sheets (90 líneas)

**Propósito:** Recibe datos del cliente y los envía a Google Sheets

**Endpoint:** `POST /api/send-to-sheets`

**Request Body:**
```json
{
  "refBateria": "BAT-12V-100AH",
  "estadoBateria": "BUENO",
  "voltaje": 12.8,
  "capacidad": 95,
  "temperatura": 25,
  "observaciones": "...",
  "timestamp": 1704067200000
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Inspección guardada en Google Sheets",
  "timestamp": "2026-01-27T10:00:00Z"
}
```

**Proceso Interno:**

```javascript
1. Validar HTTP method = POST
2. Parsear JSON del request body
3. Obtener GOOGLE_SHEET_URL de process.env
4. Validar que GOOGLE_SHEET_URL existe
5. Hacer fetch a Google Apps Script
   {
     method: 'POST',
     body: JSON.stringify(datos)
   }
6. Retornar respuesta al cliente
7. Loguear en consola de Vercel
```

**Error Handling:**

```javascript
405 → Método no permitido (solo POST)
400 → JSON inválido
500 → GOOGLE_SHEET_URL no configurada
503 → Error en Google Apps Script
```

**Logs Importantes:**

```
[Guardar Inspección] Enviando a Google Sheets...
[Guardar Inspección] URL destino: https://...
[Guardar Inspección] Respuesta de Google Sheets - Status: 200
✅ [Guardar Inspección] Éxito para referencia: BAT-001
```

**Tamaño:** ~3KB  
**Editar cuando:**
- Agregar validaciones
- Cambiar formato de respuesta
- Agregar autenticación
- Agregar rate limiting

---

### `api/referencias.js` - GET de Catálogo (75 líneas)

**Propósito:** Proporciona catálogo de referencias

**Endpoint:** `GET /api/referencias`

**Response:**
```json
{
  "ok": true,
  "referencias": [
    {
      "id": "001",
      "nombre": "BAT-12V-100AH",
      "especificacion": "12V, 100Ah, Ácido",
      "estado": "activo"
    }
  ],
  "timestamp": "2026-01-27T10:00:00Z"
}
```

**Proceso:**

```javascript
1. Validar HTTP method = GET
2. Conectar a Google Sheets API
3. Leer catálogo de referencias
4. Cachear respuesta por 24h
5. Retornar referencias al cliente
```

**Caché HTTP:**

```
Headers: Cache-Control: public, max-age=86400
→ Navegador cachea por 24 horas
→ Service Worker cachea también
→ Reduces llamadas a Google API
```

**Tamaño:** ~2.5KB  
**Editar cuando:**
- Cambiar source de referencias
- Agregar filtros
- Cambiar ttl de caché
- Agregar sorting

---

## 🛡️ Archivos de Sistema

### `sw.js` - Service Worker (178 líneas)

**Propósito:** Caching offline-first, intercepta fetch

**Características:**

1. **Instalación**
   ```javascript
   - Cachea todos los assets locales
   - Cachea Google CDN (Tailwind)
   - Saltea waiting (update inmediato)
   ```

2. **Estrategia de Fetch**

   **Cache First (Archivos Locales):**
   ```
   Solicitud a /js/app.js
     → ¿En caché? SÍ → Servir del caché
     → NO → Obtener de red → Guardar en caché
   ```

   **Network First (APIs Externas):**
   ```
   Solicitud a script.google.com
     → ¿Hay red? SÍ → Obtener red → Guardar en caché
     → NO → ¿En caché? SÍ → Servir del caché
              NO → Respuesta offline
   ```

3. **Activación**
   - Limpia cachés antiguos
   - Reclama clientes
   - Actualiza assets

**Cache Names:**
```javascript
const CACHE_NAME = 'battery-app-v5'
// Incrementar versión cuando cambien assets
// v6 → v7 → v8 (limpia automáticamente)
```

**Eventos Principales:**
- `install` → Cachea assets
- `activate` → Limpia cachés viejos
- `fetch` → Intercepta solicitudes

**Tamaño:** ~5KB  
**Editar cuando:**
- Agregar estrategias de caché
- Cambiar assets
- Optimizar para mejor offline
- Agregar validación de origin

---

### `.gitignore` - Archivos Ignorados

**Propósito:** No subir archivos sensibles/generados a Git

**Contenido Típico:**

```
node_modules/
.env
.env.local
.vercel/
.DS_Store
*.log
dist/
build/
```

**Importante:**
- ✓ Ignorar credenciales (.env)
- ✓ Ignorar dependencies (node_modules)
- ✓ Ignorar build outputs
- ✓ Ignorar archivos del sistema

**NO ignorar:**
- package.json
- package-lock.json
- src/
- public/

---

## 📊 Estructura de Carpetas Completa

```
inspeccion-baterias/
├── 📄 index.html              (3KB)   - UI principal
├── 📄 manifest.json           (1KB)   - Configuración PWA
├── 📄 sw.js                   (5KB)   - Service Worker
├── 📄 vercel.json             (1KB)   - Deploy config
├── 📄 package.json            (1KB)   - Dependencias
├── 📄 .gitignore              (0.5KB) - Archivos ignorados
│
├── 📂 js/ (14KB total)
│   ├── app.js                 (12KB)  - ⭐ Principal
│   ├── database.js            (3KB)   - IndexedDB
│   ├── sync.js                (2.5KB) - Sincronización
│   ├── api.js                 (1.5KB) - Fetch wrapper
│   ├── config.js              (0.5KB) - Config (dev)
│   └── referencias-sync.js    (3KB)   - Catálogo
│
├── 📂 api/ (5.5KB total)
│   ├── send-to-sheets.js      (3KB)   - POST Sheets
│   └── referencias.js         (2.5KB) - GET catálogo
│
├── 📂 images/ (<1KB)
│   └── battery-icon.png       - Ícono PWA
│
├── 📂 documentacion/
│   ├── 01_README.md
│   ├── 02_ARQUITECTURA.md
│   ├── 03_SEGURIDAD.md
│   ├── 04_INSTALACION.md
│   ├── 05_DESARROLLO.md
│   ├── 06_DEPLOYMENT.md
│   └── 07_ARCHIVOS.md (este)
│
└── 📂 .vercel/ (generado)     - Metadata de Vercel

Total: ~25KB código + 50MB node_modules
```

---

## 📈 Tamaño y Performance

| Archivo | Tamaño | Impacto | Optimizable |
|---------|--------|--------|------------|
| index.html | 3KB | Alto (UI) | Poco (ya comprimido) |
| Tailwind (CDN) | 50KB | Alto (CSS) | Via build step |
| sw.js | 5KB | Medio (Offline) | No crítico |
| app.js | 12KB | Alto (Lógica) | Refactorizar |
| Otros JS | 10KB | Medio | Combinar |
| **Total (minificado)** | **~80KB** | - | - |

**Vercel Metrics:**
- TTFB (Time to First Byte): <100ms
- FCP (First Contentful Paint): <500ms
- LCP (Largest Contentful Paint): <1.5s
- CLS (Cumulative Layout Shift): <0.1

