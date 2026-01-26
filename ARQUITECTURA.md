# 🏗️ Arquitectura de la Aplicación

## Diagrama de Capas

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 NAVEGADOR (Cliente)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   index.html / UI                       │   │
│  │          (Formulario de Inspección de Baterías)        │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│      ┌──────────────────────┼──────────────────────────┐        │
│      │                      │                          │        │
│      ▼                      ▼                          ▼        │
│  ┌─────────────┐        ┌──────────────┐      ┌──────────────┐│
│  │ app.js      │        │ database.js  │      │ sync.js      ││
│  │ (Lógica UI) │        │ (IndexedDB)  │      │ (SyncManager)││
│  └─────────────┘        └──────────────┘      └──────────────┘│
│      │                      │                      │            │
│      │    ┌────────────────┴──────────────┐        │            │
│      │    │                               │        │            │
│      │    ▼                               ▼        │            │
│      │  ┌────────────────────────┐      ┌────────┬┘            │
│      │  │ 💾 ALMACENAMIENTO      │      │ 📡 API │             │
│      │  │ LOCAL (IndexedDB)      │      │ CLIENT │             │
│      │  │                        │      └────────┘             │
│      │  │ • Registros pendientes │         │                  │
│      │  │ • Datos de sesión      │         │ api.js            │
│      │  │ • Contador             │         │ (APIClient)       │
│      │  └────────────────────────┘         │                  │
│      │                                     │                  │
│      └─────────────────────┬───────────────┘                  │
│                            │                                  │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ 🔒 SERVICE WORKER (sw.js) - Cache & Offline Support │   │
│  │                                                       │   │
│  │ • Cache First (local files)                         │   │
│  │ • Network First (APIs)                              │   │
│  │ • Stale While Revalidate (otros)                    │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                                      │
         │ HTTPS                                │ HTTPS
         │                                      │
         ▼                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ☁️  SERVIDOR / INTERNET                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Backend (Recomendado) - Backend Proxy / Cloud Function │   │
│  │                                                         │   │
│  │ • Node.js, Python, Google Cloud Function, etc         │   │
│  │ • Valida requests                                     │   │
│  │ • Maneja credenciales seguramente                     │   │
│  │ • Rate limiting & CORS                                │   │
│  │ • Logging & Auditoría                                 │   │
│  └────────────────────────────┬────────────────────────────┘   │
│                               │                                │
│                               ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │        🗂️ Google Sheets (via Google Apps Script)       │   │
│  │                                                         │   │
│  │ POST /macros/s/{DEPLOYMENT_ID}/exec                   │   │
│  │   • Recibe datos de inspección                        │   │
│  │   • Valida API Key                                    │   │
│  │   • Inserta en hoja de cálculo                        │   │
│  │   • Retorna respuesta                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos - Offline First

```
┌─────────────────────────────────────────────────────────────────┐
│                   USUARIO CREA REGISTRO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Rellena formulario                                          │
│     ↓                                                            │
│  2. form.submit() → app.js                                     │
│     ↓                                                            │
│  3. Valida datos localmente                                    │
│     ↓                                                            │
│  4. Crea objeto con datos + timestamp + UUID                  │
│     ↓                                                            │
│  5. saveLocal(data) → database.js                             │
│     ↓                                                            │
│  6. Guardar en IndexedDB (LOCAL)  ✅ OFFLINE OK              │
│     ↓                                                            │
│  7. Incrementar contador                                       │
│     ↓                                                            │
│  8. syncManager.triggerSync()  ← Solo si hay conexión        │
│     ↓                                                            │
│     ├─ ¿Hay conexión?                                          │
│     │  ├─ SÍ: Intentar sincronizar                            │
│     │  │   ↓                                                    │
│     │  │   apiClient.sendToGoogleSheets(data)                │
│     │  │   ↓                                                    │
│     │  │   • Timeout 10 seg                                   │
│     │  │   • Network OK? → Google Sheets recibe              │
│     │  │   • Si OK: deleteLocal(id)                          │
│     │  │   • Si error: Reintentar (3x con backoff)          │
│     │  │                                                       │
│     │  └─ NO: Guardar para sincronizar luego                │
│     │      (Cada 5 min intenta, o al detectar internet)    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estructura de Archivos

```
inspeccion-baterias/
├── index.html                 # Página principal (PWA)
├── manifest.json              # Configuración PWA
├── sw.js                      # Service Worker
├── .gitignore                 # Ignorar credenciales
│
├── js/
│   ├── config.js             # 🔐 Credenciales (NO COMMITAR)
│   ├── config.example.js      # 📋 Template de config
│   ├── app.js                # 🎯 Lógica principal de UI
│   ├── database.js           # 💾 Gestión de IndexedDB
│   ├── api.js                # 📡 Cliente HTTP a APIs
│   └── sync.js               # ⟳ Gestor de sincronización
│
├── images/
│   └── battery-icon.png       # Icono de la app
│
├── MEJORAS.md                # 📋 Documento de cambios
├── SEGURIDAD.md              # 🔒 Guía de seguridad
└── ARQUITECTURA.md           # 🏗️ Este archivo
```

---

## Dependencias y Compatibilidad

### No hay dependencias externas (puro JavaScript)
- ✅ Sin npm
- ✅ Sin librerías externas
- ✅ Código vanilla JavaScript moderno
- ✅ APIs web nativas: IndexedDB, Service Workers, Fetch

### Compatibilidad del Navegador
```
│ Feature        │ Chrome │ Firefox │ Safari │ Edge  │
├────────────────┼────────┼─────────┼────────┼───────┤
│ Service Worker │  ✅ 40 │  ✅ 44  │ ✅ 11.1│ ✅ 17 │
│ IndexedDB      │  ✅ 24 │  ✅ 16  │ ✅ 10  │ ✅ 12 │
│ Fetch API      │  ✅ 40 │  ✅ 39  │ ✅ 10.1│ ✅ 14 │
│ Crypto UUID    │  ✅ 54 │  ✅ 57  │ ✅ 16  │ ✅ 79 │
│ PWA Manifest   │  ✅ 39 │  ✅ 55  │ ✅ 15  │ ✅ 79 │
```

### Requisitos Mínimos
- Navegador moderno (2018+)
- HTTPS obligatorio en producción
- ~1MB de storage local disponible

---

## Integración de Componentes

### app.js ← Punto de Entrada
```javascript
// Carga: config.js → database.js → api.js → sync.js → app.js

// Crea formulario
form.addEventListener('submit', async (e) => {
    // 1. Validar
    // 2. database.saveLocal() ← Guardar local
    // 3. syncManager.triggerSync() ← Intentar sincronizar
});
```

### sync.js ← Orquestador de Sincronización
```javascript
class SyncManager {
    async syncData() {
        const pending = database.getAllPending(); // ← Lee local
        for (record of pending) {
            const result = await apiClient.send(record); // ← Envía a servidor
            if (success) {
                database.deleteLocal(record.id); // ← Limpia local
            }
        }
    }
}
```

### api.js ← Comunicación con Backend
```javascript
class APIClient {
    async sendToGoogleSheets(data) {
        // 1. Obtiene credenciales de config.js
        const config = getAPIConfig();
        // 2. Fetch con timeout
        // 3. Retorna {status, sent}
    }
}
```

### database.js ← Persistencia Local
```javascript
async function saveLocal(data) {
    // Abre IndexedDB
    // Inserta en store "inspections"
    // Retorna ID generado
}
```

### sw.js ← Control de Red
```javascript
// Intercepta todos los fetch requests
// Si hay cache → Sirve del cache (offline-first)
// Si hay red → Intenta red
// Fallback → Respuesta offline
```

---

## Seguridad por Capas

```
┌─────────────────────────────────────────────────────────────┐
│ 1️⃣ NAVEGADOR                                               │
│    • CSP (Content Security Policy)                        │
│    • CORS validado                                        │
│    • HTTPS obligatorio                                    │
│    • Credenciales en config.js (ignorado en git)         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│ 2️⃣ SERVICE WORKER                                           │
│    • Caché versionado                                     │
│    • Request validation                                   │
│    • Offline fallback seguro                              │
└─────────────────────────────▼─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│ 3️⃣ BACKEND (Recomendado)                                    │
│    • Validación de datos                                  │
│    • API Key verificación                                 │
│    • Rate limiting                                        │
│    • Logging y auditoría                                  │
│    • Credenciales en variables env                        │
└─────────────────────────────▼─────────────────────────────────┘
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│ 4️⃣ GOOGLE SHEETS                                           │
│    • OAuth 2.0 / API Key (en backend)                    │
│    • Validación de entrada en Apps Script                │
│    • Auditoría de cambios                                │
│    • Backup automático                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance

### Carga Inicial
- HTML: ~15KB
- CSS (Tailwind CDN): ~50KB
- JavaScript: ~20KB
- Total: ~85KB (con compresión)

### Tiempo de Respuesta
- Offline: <100ms (local cache)
- Online (local): ~200ms (IndexedDB)
- Sincronización: 1-5 segundos por registro

### Almacenamiento Local
- IndexedDB: 50MB+ disponible
- Capacidad: ~1000 registros sin problemas

---

## Escalabilidad

### Actual
- ✅ Soporta 1000+ registros locales
- ✅ 1-5 usuarios simultáneos offline
- ✅ Sincronización automática cada 5 min

### Con Backend Proxy
- ✅ Soporta 100+ usuarios concurrentes
- ✅ 10000+ registros en servidor
- ✅ Webhook notifications
- ✅ Real-time sync updates

### Posibles Mejoras
1. Implementar Queue persistente (vs en memoria)
2. Compression de datos antes de enviar
3. Delta sync (solo cambios)
4. WebSocket para sync en tiempo real
5. Replicación de Google Sheets a BD relacional

---

## Diagrama de Estados

```
        ┌──────────────┐
        │   CARGANDO   │
        │  (Splash)    │
        └──────┬───────┘
               │
       ┌───────▼────────┐
       │  OFFLINE/ONLINE │
       │   (Detectando)  │
       └───────┬────────┘
               │
        ┌──────┴──────────┐
        │                 │
    OFFLINE            ONLINE
        │                 │
        ▼                 ▼
    ┌────────┐      ┌──────────┐
    │FORMULARIO     │FORMULARIO │
    │ DISPONIBLE    │ + SYNC    │
    │              │           │
    │ • Guardar   │ • Guardar  │
    │   local     │ • Sincronizar
    │ • Contador  │ • Contador │
    └─────┬──────┘ └──────┬───┘
          │               │
          │        ┌──────▼──────┐
          │        │SINCRONIZANDO │
          │        │              │
          │        │ • Enviando   │
          │        │ • Reintentando
          │        └──────┬───────┘
          │               │
          └───────┬───────┘
                  │
            ┌─────▼─────┐
            │ ACTUALIZADO│
            │ / ERROR    │
            └────────────┘
```

---

## Métricas de Monitoreo

### Recomendadas para tracking
```javascript
// syncManager.getDiagnostics() retorna:
{
    isSyncing: boolean,
    lastSyncTime: Date,
    errorCount: number,
    recentErrors: [{
        recordId: string,
        error: string,
        timestamp: Date,
        attempts: number
    }]
}
```

### Eventos a loguear
- `[SYNC] Sincronización iniciada`
- `[SYNC] Registro X sincronizado`
- `[SYNC] Error en registro X (intento N)`
- `[SW] Cache actualizado`
- `[APP] Registro creado`

---

## Roadmap

### ✅ Implementado (v5)
- Offline-first completo
- API oculta en config.js
- Reintentos y backoff
- Service Worker v2

### 🚀 Próximas versiones
- v6: Backend proxy implementado
- v7: OAuth 2.0 authentication
- v8: Real-time sync con WebSocket
- v9: Dashboard y analytics
- v10: Soporte multi-usuario

---

Última actualización: 26 enero 2026
Versión actual: v5 - Offline First + API Segura
