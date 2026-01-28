# Seguridad y Gestión de Credenciales

## 🔐 Principios de Seguridad

Este proyecto implementa un modelo de seguridad en capas basado en principios enterprise:

```
┌─────────────────────────────────────────────────────┐
│ PRINCIPIOS DE SEGURIDAD (Security by Design)       │
├─────────────────────────────────────────────────────┤
│ ✓ Credenciales NO en código fuente               │
│ ✓ HTTPS obligatorio en producción                 │
│ ✓ Service Worker con validación de origen        │
│ ✓ Variables de entorno en Vercel                 │
│ ✓ Validación de entrada en backend               │
│ ✓ CORS configurado correctamente                 │
│ ✓ Encriptación de datos en tránsito              │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Gestión de Credenciales

### ❌ INCORRECTO (NUNCA HAGAS ESTO)

```javascript
// ❌ NO exponer URLs en el cliente
const API_URL = "https://script.google.com/macros/s/AKfycbxxkhNdwTpGrx1DYsi3nW085n2ehU0hICKzTu-B4v89Il0Ghru5cjiDCRJ_6Tsd1kI3/exec";

// ❌ NO guardar credenciales en js/config.js públicamente
const credentials = {
    sheets: "mi-url-secreta",
    apiKey: "mi-api-key"
};

// ❌ NO commitear .env con secretos
GOOGLE_SHEET_URL=https://script.google.com/macros/...
API_KEY=sk-1234567890
```

### ✅ CORRECTO (CÓMO LO HACEMOS)

```javascript
// ✅ Credenciales en variables de entorno de Vercel
// Accesibles SOLO en backend (send-to-sheets.js)

// backend/api/send-to-sheets.js
export default async function handler(req, res) {
    // Leer credenciales del entorno (SERVIDOR)
    const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
    
    // El cliente NUNCA conoce la URL real
    // Solo sabe que debe POST a /api/send-to-sheets
}
```

---

## 📋 Variables de Entorno

### Configuración en Vercel

**Dashboard:** https://vercel.com/dashboard → Project Settings → Environment Variables

```
Variable Name: GOOGLE_SHEET_URL
Value: https://script.google.com/macros/s/AKfycbxxkhNdwTpGrx1DYsi3nW085n2ehU0hICKzTu-B4v89Il0Ghru5cjiDCRJ_6Tsd1kI3/exec
Environments: Production, Preview, Development
```

### Archivo `vercel.json` (NO CONTIENE VALORES)

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "cleanUrls": true
}
```

⚠️ **Importante:** Las variables de entorno se definen en el dashboard de Vercel, NO en `vercel.json`

---

## 🔄 Flujo de Seguridad de Datos

### 1. **Cliente (Frontend) - Sin Credenciales**

```
index.html
  ↓ Envía JSON con datos de inspección
  ↓ POST a http://localhost/api/send-to-sheets
  ↓ NO conoce la URL de Google Apps Script
  ↓ NO envía credenciales
```

### 2. **Vercel Functions (Backend) - Con Credenciales**

```
api/send-to-sheets.js
  ↓ Lee GOOGLE_SHEET_URL de process.env
  ↓ Valida y sanitiza datos de entrada
  ↓ Construye solicitud POST a Google Apps Script
  ↓ Usa la URL real (segura en servidor)
  ↓ Retorna respuesta al cliente
```

### 3. **Google Apps Script - Persistencia**

```
Google Apps Script
  ↓ Recibe POST de Vercel
  ↓ Valida datos
  ↓ Escribe en Google Sheets
  ↓ Responde con confirmación
```

---

## 🛡️ Mecanismos de Protección

### Service Worker - Validación de Origen

```javascript
// sw.js - Solo permite sincronización con APIs seguras
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    
    // ✓ Permitir solo solicitudes a origen propio
    if (url.origin === self.location.origin) {
        // Cache First para archivos locales
    }
    
    // ✓ Network First solo para Google APIs
    if (url.hostname.includes('script.google.com')) {
        // Network First para APIs externas
    }
});
```

### Validación en Backend

```javascript
// api/send-to-sheets.js
export default async function handler(req, res) {
    // ✓ Validar método HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false });
    }
    
    // ✓ Validar JSON
    try {
        const datos = req.body;
        if (typeof datos === 'string') {
            datos = JSON.parse(datos);
        }
    } catch (e) {
        return res.status(400).json({ ok: false, error: 'JSON inválido' });
    }
    
    // ✓ Verificar que GOOGLE_SHEET_URL existe
    if (!process.env.GOOGLE_SHEET_URL) {
        return res.status(500).json({ ok: false });
    }
}
```

### HTTPS Obligatorio

```
✓ Desarrollo: localhost (soporta tanto HTTP como HTTPS)
✓ Producción: HTTPS requerido (Vercel lo proporciona por defecto)
✓ PWA: Service Worker requiere HTTPS en producción

Si accedes a https://inspeccion-baterias-xxx.vercel.app:
- HTTPS ✓ automático
- Certificado ✓ válido
- Service Worker ✓ funciona correctamente
```

---

## 🚫 Riesgos y Mitigación

### Riesgo 1: Exposición de Credenciales en Repositorio

| Riesgo | Mitigación |
|--------|-----------|
| Subir credenciales a GitHub | `.gitignore` los archivos sensibles |
| Comprometer Google Apps Script | Variables de entorno en Vercel |
| Acceso no autorizado | Solo desarrolladores autorizados |

**Acción:** Revisar commits antes de push
```bash
git status                    # Ver qué va a subirse
git diff --staged            # Ver cambios
```

### Riesgo 2: Man-in-the-Middle (MITM)

| Riesgo | Mitigación |
|--------|-----------|
| Interceptar datos en tránsito | HTTPS + TLS 1.3 |
| Modificar solicitudes | CORS validado |
| Suplantación de servidor | Certificados SSL válidos |

**Producción:** `https://inspeccion-baterias-xxx.vercel.app` (HTTPS automático)

### Riesgo 3: XSS (Cross-Site Scripting)

| Riesgo | Mitigación |
|--------|-----------|
| Inyección de scripts | Sanitizar entrada en backend |
| DOM injection | Usar textContent en lugar de innerHTML |
| Ataques desde terceros | Content Security Policy (CSP) |

---

## 🔍 Auditoría de Seguridad

### Checklist de Seguridad

```bash
□ Verificar que js/config.js NO contiene URLs completas
□ Confirmar que GOOGLE_SHEET_URL está en Vercel (no en código)
□ Validar que .gitignore contiene archivos sensibles
□ Revisar que api/send-to-sheets.js valida entrada
□ Confirmar HTTPS en producción
□ Verificar Service Worker solo cachea URLs seguras
□ Revisar que no hay credenciales en localStorage
□ Validar que IndexedDB no almacena datos sensibles sin encriptar
```

### Comandos de Verificación

```bash
# Buscar credenciales en el repositorio
grep -r "https://script.google.com" .
grep -r "api_key" .
grep -r "sk-" .

# Verificar .gitignore
cat .gitignore

# Buscar archivos con credenciales
find . -name "*.env*" -o -name "*secret*" -o -name "*credential*"
```

---

## 🔐 Procedimiento de Actualización de Credenciales

Si necesitas actualizar la URL de Google Apps Script:

### 1. **Generar Nueva URL en Google Apps Script**
```
Agregar nueva versión del proyecto
Copiar nueva URL de deployment
```

### 2. **Actualizar en Vercel Dashboard**
```
1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto "inspeccion-baterias"
3. Settings → Environment Variables
4. Editar GOOGLE_SHEET_URL
5. Seleccionar todos los environments
6. Guardar
7. El redeploy es automático
```

### 3. **NO necesita cambios en código**
```
✓ api/send-to-sheets.js sigue igual
✓ Frontend no conoce la URL
✓ js/config.js se ignora en producción
```

### 4. **Verificar en Producción**
```bash
# Test endpoint
curl -X POST https://inspeccion-baterias-xxx.vercel.app/api/send-to-sheets \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## 📝 Compliance y Regulaciones

### GDPR (Protección de Datos)

```
✓ Datos almacenados en Google Sheets (EU data centers disponibles)
✓ Usuario puede solicitar exportación de datos
✓ Usuario puede solicitar eliminación
✓ Política de privacidad debe informar sobre Google Sheets
```

### Auditoría Corporativa

```
✓ Acceso solo a través de Vercel (logging disponible)
✓ Variables de entorno no se exponen en logs
✓ HTTPS en tránsito
✓ Credenciales rotadas periódicamente
```

---

## 🚨 Respuesta a Incidentes

### Si sospechas que credenciales fueron expuestas:

1. **INMEDIATO:** Deshabilitar versión del Google Apps Script
2. **EN 1 HORA:** Generar nueva URL en Google Apps Script
3. **EN 2 HORAS:** Actualizar GOOGLE_SHEET_URL en Vercel
4. **DENTRO DE 24H:** Auditoría de accesos en Google Sheets
5. **DOCUMENTAR:** Incident report interno

---

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/Top10/)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [Service Worker Security](https://w3c.github.io/ServiceWorker/)
- [Google Apps Script Security](https://developers.google.com/apps-script/guides/security)

