# Arquitectura del Sistema

## 📐 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                        │
│                   (Frontend - index.html)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  UI: Formulario de Inspección + Contador + Referencias    │ │
│  │  Teknologi: HTML5, Tailwind CSS, JavaScript ES6+         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                    CAPA DE LÓGICA (JS)                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  app.js       → Gestión de eventos y UI               │   │
│  │  database.js  → Operaciones IndexedDB                  │   │
│  │  sync.js      → Orquestación de sincronización         │   │
│  │  api.js       → Llamadas a APIs                        │   │
│  │  config.js    → Configuración sensible                 │   │
│  │  referencias-sync.js → Carga de catálogo              │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              CAPA DE ALMACENAMIENTO LOCAL                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IndexedDB      → Persistencia de registros             │  │
│  │  LocalStorage   → Contador y configuración              │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              CAPA DE SERVICE WORKER (sw.js)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Caché offline-first (Cache First)                   │  │
│  │  • Network-first para APIs externas                    │  │
│  │  • Intercepción de fetch                               │  │
│  │  • Gestión de actualizaciones                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────┬───────────────────────────────┬────────────────────────┘
         │                               │
    ┌────▼─────────────────────────┐  ┌─▼──────────────────────────┐
    │   APIS EXTERNAS (Network)    │  │   APIS BACKEND (Vercel)    │
    │                              │  │                            │
    │ • Google Apps Script        │  │ • send-to-sheets.js        │
    │ • Google Sheets API          │  │ • referencias.js            │
    │                              │  │                            │
    └────┬─────────────────────────┘  └─┬──────────────────────────┘
         │                              │
    ┌────▼──────────────────────────────▼──────────────────────┐
    │         SERVICIOS EXTERNOS (Google Cloud)                │
    │                                                          │
    │  • Google Sheets (Sincronización de datos)              │
    │  • Google Drive (Almacenamiento)                        │
    │  • Google Apps Script (Automatización)                  │
    └──────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos

### 1. **Registro de Inspección (Online)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario completa formulario en index.html               │
└──────────────┬──────────────────────────────────────────────┘
               │ event listener (form.onsubmit)
┌──────────────▼──────────────────────────────────────────────┐
│ 2. app.js valida datos y prepara objeto                    │
└──────────────┬──────────────────────────────────────────────┘
               │ guardarEnIndexedDB()
┌──────────────▼──────────────────────────────────────────────┐
│ 3. database.js → Inserta en IndexedDB                       │
└──────────────┬──────────────────────────────────────────────┘
               │ incrementarContador()
┌──────────────▼──────────────────────────────────────────────┐
│ 4. app.js incrementa contador (localStorage)               │
└──────────────┬──────────────────────────────────────────────┘
               │ Si conexión disponible → sync.js
┌──────────────▼──────────────────────────────────────────────┐
│ 5. sync.js → POST a /api/send-to-sheets                    │
└──────────────┬──────────────────────────────────────────────┘
               │ Vercel Function
┌──────────────▼──────────────────────────────────────────────┐
│ 6. send-to-sheets.js → Google Apps Script URL              │
│    (Variables de entorno: GOOGLE_SHEET_URL)                │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ 7. Google Sheets → Actualización de fila                   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│ 8. Respuesta al cliente + notificación de éxito            │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Sincronización Offline → Online**

```
Cuando el dispositivo estaba offline:
    ↓
IndexedDB guarda inspecciones localmente
    ↓
Al recuperar conexión:
    ↓
sync.js detecta conexión (online event)
    ↓
Ejecuta sincronización pendiente
    ↓
Cada registro IndexedDB → POST a /api/send-to-sheets
    ↓
Google Sheets actualiza con todos los registros
```

### 3. **Carga de Referencias (Catálogo)**

```
┌──────────────────────────────┐
│ Inicio de la aplicación      │
└──────────┬───────────────────┘
           │
┌──────────▼───────────────────┐
│ referencias-sync.js          │
│ Verifica LocalStorage         │
└──────────┬───────────────────┘
           │
      ¿Cache válido?
      │          │
      NO         SÍ
      │          └─→ Usa cache del LocalStorage
      │
┌──────────▼─────────────────────┐
│ POST a /api/referencias         │
│ (Vercel Function)              │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│ Google Sheet API               │
│ (Lee catálogo de referencias)  │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│ Retorna referencias a cliente  │
│ Se cachean en LocalStorage     │
└──────────┬─────────────────────┘
           │
┌──────────▼─────────────────────┐
│ Pobla dropdown en formulario   │
└──────────────────────────────────┘
```

---

## 🏗️ Componentes Principales

### **Frontend (Cliente)**

#### `index.html`
- Estructura HTML5 semántica
- Componentes UI: formulario, contador, lista de referencias
- Splash screen (pantalla de carga)
- Navegación persistent (sticky header)
- Responsive design con Tailwind CSS

#### `app.js` (Principal)
```javascript
Responsabilidades:
• Inicialización de la aplicación
• Manejo de eventos del formulario
• Gestión del contador (increment, reset cada 24h)
• Notificaciones al usuario
• Validación de datos
• Coordinación entre módulos
```

#### `database.js`
```javascript
Responsabilidades:
• Operaciones CRUD en IndexedDB
• Crear/leer/actualizar/eliminar registros
• Consultas a la base de datos local
• Manejo de transacciones
```

#### `sync.js`
```javascript
Responsabilidades:
• Detectar cambios de conectividad
• Sincronización de datos pendientes
• Orquestación de POST a API
• Manejo de errores de sincronización
• Reintentos inteligentes
```

#### `api.js`
```javascript
Responsabilidades:
• Wrapper de fetch() con manejo de errores
• Construcción de solicitudes HTTP
• Parsing de respuestas JSON
• Logging de llamadas a API
```

#### `config.js`
```javascript
Responsabilidades:
• Almacenar URLs de Google Apps Script
• Claves API (NO deben ir aquí en producción)
• Getters para obtener config de forma segura
```

#### `referencias-sync.js`
```javascript
Responsabilidades:
• Cargar catálogo de baterías
• Cachear referencias en LocalStorage
• Actualizar dropdown del formulario
• Validar que referencias sean válidas
```

---

### **Backend (Vercel Serverless)**

#### `api/send-to-sheets.js`
```javascript
POST /api/send-to-sheets
- Recibe datos de inspección del cliente
- Valida JSON de entrada
- Lee GOOGLE_SHEET_URL de variables de entorno
- Reenvía a Google Apps Script
- Maneja errores y respuestas
```

#### `api/referencias.js`
```javascript
GET /api/referencias
- Obtiene catálogo de baterías
- Lee de Google Sheets API
- Cachea respuesta en HTTP headers
- Retorna JSON con referencias
```

---

### **Service Worker (sw.js)**

#### Estrategias de Caché

**Cache First (Assets Locales)**
```
Solicitud de archivo local
  ↓
¿Está en caché?
  ├─ SÍ → Servir del caché
  └─ NO → Obtener de red → Guardar en caché
```

**Network First (APIs Externas)**
```
Solicitud a Google Scripts
  ↓
¿Hay conexión?
  ├─ SÍ → Obtener de red → Guardar en caché → Servir
  └─ NO → ¿Está en caché?
         ├─ SÍ → Servir del caché
         └─ NO → Respuesta offline
```

---

## 💾 Modelo de Datos

### **IndexedDB Schema**

```javascript
Database: "battery-app"

ObjectStore: "inspections"
{
  keyPath: "id" (UUID),
  indexes: [
    { name: "timestamp", keyPath: "timestamp" },
    { name: "estado", keyPath: "estado" }
  ]
}

Record:
{
  id: "uuid-1234",
  refBateria: "BAT-001",
  estadoBateria: "BUENO",
  voltaje: 12.8,
  capacidad: 95,
  temperatura: 25,
  observaciones: "...",
  timestamp: 1704067200000,
  sincronizado: false,
  fechaSincronizacion: null
}
```

### **LocalStorage Schema**

```javascript
{
  "baterias_registradas_contador": "42",
  "baterias_ultimo_reinicio": "2026-01-27T08:00:00Z",
  "baterias_historial_contadores": "[{contador: 42, fecha: ..., timestamp: ...}]",
  "referencias_cache": "[{id: '001', nombre: 'BAT-12V-100AH', ...}]",
  "referencias_cache_timestamp": "1704067200000"
}
```

---

## 🔌 Puntos de Integración

### Google Apps Script
- **Endpoint:** `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
- **Método:** POST
- **Payload:** JSON con datos de inspección
- **Respuesta:** Confirmación de escritura en Google Sheets

### Google Sheets API
- **Endpoint:** Google Cloud API
- **Autenticación:** Requiere API key o service account
- **Uso:** Lectura de catálogo de referencias

### Vercel Deployment
- **Runtime:** Node.js 18+
- **Functions:** `/api/*.js`
- **Variables de Entorno:** Seguras, no expuestas al cliente
- **URLs de Producción:** `https://inspeccion-baterias-xxx.vercel.app`

---

## 🔐 Flujo de Seguridad

```
Cliente (index.html)
    ↓ (No expone credenciales)
Vercel API Functions (/api/*)
    ↓ (Lee credenciales de variables de entorno)
Google Apps Script (URL en GOOGLE_SHEET_URL)
    ↓ (Envía datos a Google Sheets)
Google Sheets
    ↓ (Persistencia)
Base de datos corporativa
```

---

## 📈 Escalabilidad

### Limitaciones Actuales
- IndexedDB: ~50MB por origen
- LocalStorage: ~5-10MB
- Google Sheets: Libre hasta 5M celdas

### Consideraciones de Escala
- Para >1000 registros/día: Considerar backend dedicado
- Para >10 usuarios simultáneos: Optimizar Google Apps Script
- Para almacenamiento >500MB: Migrar a BD SQL

---

