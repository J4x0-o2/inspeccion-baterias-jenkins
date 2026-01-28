# Instalación y Setup del Proyecto

## 🖥️ Requisitos Previos

### Software Requerido

```bash
✓ Node.js v18.0.0 o superior
✓ npm v9.0.0 o superior (incluido con Node.js)
✓ Git v2.30.0 o superior
✓ Navegador moderno (Chrome, Firefox, Edge, Safari)
✓ Cuenta de GitHub con acceso al repositorio
✓ Cuenta de Vercel (gratuita)
✓ Cuenta de Google Cloud
```

### Verificar versiones instaladas

```bash
node --version      # v18.x.x
npm --version       # v9.x.x
git --version       # v2.3x.x
```

---

## 📥 1. Clonar el Repositorio

```bash
# Opción A: SSH (recomendado si tienes SSH configurada)
git clone git@github.com:J4x0-o2/inspeccion-baterias.git

# Opción B: HTTPS
git clone https://github.com/J4x0-o2/inspeccion-baterias.git

# Ingresar a la carpeta
cd inspeccion-baterias
```

---

## 📦 2. Instalar Dependencias

```bash
# Instalar npm packages
npm install

# Verificar que se instalaron correctamente
npm list --depth=0

# Resultado esperado:
# inspeccion-baterias@1.0.0
# ├── node-fetch@3.3.0
# └── netlify-cli@17.0.0
```

---

## 🔑 3. Configurar Google Apps Script

### Paso 1: Crear Google Apps Script

1. Ir a [script.google.com](https://script.google.com)
2. Crear nuevo proyecto
3. Nombre: "Inspección Baterías - Backend"

### Paso 2: Código del Google Apps Script

Pega este código en el editor:

```javascript
/**
 * Google Apps Script - Recibe datos de inspección de Vercel
 * Escribe en Google Sheets automáticamente
 */

// ID de la hoja de cálculo destino
const SHEET_ID = 'TU_GOOGLE_SHEET_ID'; // Reemplazar con tu ID
const SHEET_NAME = 'Inspecciones';

function doPost(e) {
  try {
    // Parsear datos JSON
    const datos = JSON.parse(e.postData.contents);
    
    // Obtener hoja
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Crear hoja si no existe
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      agregarEncabezados(sheet);
    }
    
    // Agregar datos
    sheet.appendRow([
      new Date(),           // Timestamp
      datos.refBateria,     // Referencia
      datos.estadoBateria,  // Estado
      datos.voltaje,        // Voltaje
      datos.capacidad,      // Capacidad
      datos.temperatura,    // Temperatura
      datos.observaciones,  // Observaciones
      datos.usuario || 'N/A' // Usuario
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'Guardado' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error: ' + error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function agregarEncabezados(sheet) {
  sheet.appendRow([
    'Timestamp',
    'Referencia Batería',
    'Estado',
    'Voltaje (V)',
    'Capacidad (%)',
    'Temperatura (°C)',
    'Observaciones',
    'Usuario'
  ]);
}

// Función para crear URL de deployment
function crearDeployment() {
  const deployment = ScriptApp.getService().getUrl();
  Logger.log('URL: ' + deployment);
}
```

### Paso 3: Crear Google Sheet destino

1. Crear nuevo Google Sheet
2. Copiar el ID de la URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Reemplazar `SHEET_ID` en el script anterior

### Paso 4: Hacer deployment

```
1. Editor de Apps Script → Deploy → New deployment
2. Select type → Web app
3. Execute as → Tu cuenta
4. Who has access → Anyone
5. Deploy
6. Copiar URL de deployment
```

---

## 🌐 4. Configurar Vercel

### Opción A: Vercel CLI (Recomendado)

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Desde la carpeta del proyecto
cd inspeccion-baterias

# Login en Vercel
vercel login

# Deployment interactivo
vercel

# Responder preguntas:
# ✓ Set up and deploy? → y
# ✓ Which scope? → [Tu cuenta]
# ✓ Link to existing project? → n (primera vez)
# ✓ Project name? → inspeccion-baterias
# ✓ Directory? → . (raíz)
```

### Opción B: GitHub + Vercel Dashboard

```
1. Ir a https://vercel.com/dashboard
2. Click "New Project"
3. Seleccionar repositorio GitHub: J4x0-o2/inspeccion-baterias
4. Configurar:
   - Framework: Other
   - Build Command: (dejar vacío)
   - Output Directory: . (punto)
5. Deploy
```

---

## 🔐 5. Agregar Variables de Entorno

### En Dashboard de Vercel

```
Dashboard → Project Settings → Environment Variables
```

Agregar variable:

```
Name:  GOOGLE_SHEET_URL
Value: https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
Environment: Production, Preview, Development
```

**Obtener DEPLOYMENT_ID:**
1. Google Apps Script → Deploy → Manage deployments
2. Copiar ID de la URL: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`

---

## 🚀 6. Deployment a Producción

```bash
# Después de configurar variables de entorno, hacer redeploy
vercel --prod

# Resultado:
# Vercel CLI 50.6.1
# > Production
# > https://inspeccion-baterias-xxx.vercel.app [in 2s]
```

---

## 🧪 7. Verificar Instalación

### Test 1: Acceso a la aplicación

```bash
# Abrir en navegador
https://inspeccion-baterias-xxx.vercel.app

# Debe aparecer:
✓ Splash screen de carga
✓ Título "Registro de Baterías"
✓ Formulario con campos
✓ Contador de registros
✓ Dropdown de referencias (puede tardar segundos)
```

### Test 2: Guardar un registro

```bash
1. Seleccionar una referencia de batería
2. Llenar formulario con datos de prueba
3. Hacer clic "Guardar"
4. Esperar notificación de éxito
5. Verificar que Google Sheet se actualizó
```

### Test 3: Funcionalidad Offline

```bash
1. Abrir Chrome DevTools (F12)
2. Network → Offline
3. Guardar registro (debe funcionar)
4. Volver online
5. Verificar que se sincroniza con Google Sheets
```

### Test 4: PWA Installation

```bash
1. Abrir aplicación en navegador
2. Chrome: Menu → "Install app"
3. Firefox: Menu → "Install as App"
4. La app debe instalarse como aplicación nativa
5. Funcionar sin navegador
```

---

## 📝 Estructura de Carpetas Después de Instalación

```
inspeccion-baterias/
├── .vercel/                # Generado por Vercel
├── node_modules/           # Generado por npm install
├── .git/                   # Repositorio Git
├── .gitignore             # Archivos ignorados
│
├── index.html             # ✓ Frontend principal
├── manifest.json          # ✓ Configuración PWA
├── sw.js                  # ✓ Service Worker
├── vercel.json            # ✓ Config Vercel
├── package.json           # ✓ Dependencias
│
├── js/
│   ├── app.js            # ✓ Lógica principal
│   ├── database.js       # ✓ IndexedDB
│   ├── sync.js           # ✓ Sincronización
│   ├── api.js            # ✓ Llamadas HTTP
│   ├── config.js         # ✓ Configuración
│   └── referencias-sync.js # ✓ Catálogo
│
├── api/
│   ├── send-to-sheets.js # ✓ POST a Google Sheets
│   └── referencias.js    # ✓ GET de referencias
│
├── images/
│   └── battery-icon.png  # ✓ Icono
│
└── documentacion/        # ✓ Documentación
    ├── 01_README.md
    ├── 02_ARQUITECTURA.md
    ├── 03_SEGURIDAD.md
    ├── 04_INSTALACION.md (este archivo)
    ├── 05_DESARROLLO.md
    ├── 06_DEPLOYMENT.md
    └── 07_ARCHIVOS.md
```

---

## 🐛 Troubleshooting

### Problema: "npm install falla"

```bash
# Solución 1: Limpiar caché
npm cache clean --force
npm install

# Solución 2: Verificar versión de Node
node --version  # Debe ser v18+

# Solución 3: Reinstalar node_modules
rm -r node_modules package-lock.json
npm install
```

### Problema: "Error connecting to GitHub en Vercel"

```bash
# Verificar que tienes acceso al repositorio
git clone https://github.com/J4x0-o2/inspeccion-baterias.git

# Si falla, asegúrate de:
1. Estar logeado en GitHub
2. Tener permisos en el repositorio
3. Usar SSH o HTTPS correctamente
```

### Problema: "GOOGLE_SHEET_URL no configurada"

```
En el formulario aparece error: "GOOGLE_SHEET_URL no configurada"

Solución:
1. Vercel Dashboard → Settings → Environment Variables
2. Verificar que GOOGLE_SHEET_URL está agregada
3. Hacer redeploy: vercel --prod
4. Esperar 1 minuto y recargar la página
```

### Problema: "Service Worker no se registra"

```bash
# Verificar en Chrome DevTools
1. F12 → Application → Service Workers
2. Debe aparecer "sw.js" en status "activated"

Si no aparece:
- Verificar HTTPS en producción
- Verificar que sw.js es accesible
- Limpiar caché: Ctrl+Shift+Delete
```

### Problema: "Dropdown de referencias vacío"

```bash
# Verificar en consola
1. F12 → Console
2. Ver si hay errores de CORS o red
3. Verificar que Google Sheet de referencias existe
4. Revisar api/referencias.js en Vercel logs
```

---

## ✅ Checklist de Instalación Completa

```
□ Node.js v18+ instalado
□ npm packages instalados (npm install)
□ Google Apps Script creado y deployado
□ Google Sheet creado con ID configurado
□ Vercel proyecto creado
□ GOOGLE_SHEET_URL agregada en variables de entorno
□ Deployment a producción completado
□ Acceso a https://inspeccion-baterias-xxx.vercel.app funcionando
□ Formulario cargando referencias correctamente
□ Registro guardándose en Google Sheets
□ Service Worker registrado
□ PWA instalable en dispositivo
□ Funcionalidad offline verificada
```

---

## 📞 Soporte

Si encuentras problemas durante la instalación:

1. Revisar esta documentación completa
2. Verificar [02_ARQUITECTURA.md](02_ARQUITECTURA.md) para entender flujos
3. Revisar [03_SEGURIDAD.md](03_SEGURIDAD.md) para credenciales
4. Abrir issue en GitHub: https://github.com/J4x0-o2/inspeccion-baterias/issues

