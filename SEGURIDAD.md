# 🔒 Guía de Seguridad y Despliegue

## Checklist de Seguridad Pre-Producción

### 1. Credenciales API ⚠️ CRÍTICO
- [ ] **NUNCA** commitar `js/config.js` con credenciales reales
- [ ] Agregar a `.gitignore`:
  ```
  js/config.js
  .env
  .env.local
  ```
- [ ] Crear template:
  ```bash
  cp js/config.js js/config.example.js
  ```

### 2. Estrategia de Credenciales

#### Opción A: Backend Proxy (RECOMENDADO) ✅
```
Cliente (App) 
    ↓ [HTTPS]
Backend (Node/Python)
    ↓ [Credenciales seguras en variables env]
Google Sheets
```

**Ventajas:**
- Credenciales nunca en el cliente
- Control de acceso centralizado
- Auditoría de requests
- Rate limiting

**Backend ejemplo (Node.js):**
```javascript
// server.js
const express = require('express');
const app = express();

app.post('/api/sync', async (req, res) => {
    const apiKey = process.env.GOOGLE_SHEETS_KEY;
    const apiUrl = process.env.GOOGLE_SHEETS_URL;
    
    // Usar credenciales del servidor
    const response = await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(req.body),
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    res.json(await response.json());
});

app.listen(3000);
```

#### Opción B: Service Worker + Variables Env
```
Build Time
    ↓
Inyectar vars env en Service Worker
    ↓
Credenciales en Runtime (SW), no en código fuente
```

#### Opción C: Cloud Function (Google Cloud)
```
App → Google Cloud Function → Google Sheets
     (Con credenciales seguras)
```

---

## 3. CORS y Validación

### Configurar CORS en Google Apps Script
```javascript
// Code.gs
function doPost(e) {
    const originDomain = 'https://tunombre.netlify.app';
    
    const response = HtmlService.createHtmlOutput("OK")
        .setHeader("Access-Control-Allow-Origin", originDomain)
        .setHeader("Access-Control-Allow-Methods", "POST")
        .setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    // Validar API Key
    const providedKey = JSON.parse(e.postData.contents).apiKey;
    if (providedKey !== VALID_API_KEY) {
        return HtmlService.createHtmlOutput("Unauthorized").setHttpResponseCode(401);
    }
    
    // Procesar datos
    procesarDatos(JSON.parse(e.postData.contents));
    return response;
}
```

---

## 4. Service Worker Security

### Cambiar Caché con Versión
```javascript
// sw.js - Incrementar siempre en deploy
const CACHE_NAME = 'battery-app-v5-20260126';
```

### Content Security Policy (CSP)
En `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://cdn.tailwindcss.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:">
```

---

## 5. IndexedDB Security

El navegador ya aisla IndexedDB por dominio, pero:
- ✅ Validar datos antes de guardar
- ✅ No guardar sensibles sin encripción
- ✅ Limpiar datos al logout

```javascript
// Ejemplo: Limpiar datos
async function clearLocalData() {
    const db = await openDB();
    db.clear();
}
```

---

## 6. Testing de Seguridad

### Pruebas a realizar:
```bash
# 1. Verificar credenciales no en caché
curl -I https://tunombre.netlify.app/js/config.js
# Debe retornar 404 o estar protegido

# 2. Verificar Service Worker
chrome://serviceworker-internals

# 3. Analizar network en DevTools
# F12 → Network → Buscar "script.google.com"
# No debe haber API Key visible en headers

# 4. Lighthouse PWA check
# DevTools → Lighthouse → PWA
```

---

## 7. Despliegue Seguro

### Netlify Deploy
```bash
# .netlify/functions/sync.js
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return;
    
    const data = JSON.parse(event.body);
    const apiKey = process.env.GOOGLE_API_KEY;  // Del build
    
    const response = await fetch(process.env.GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(await response.json())
    };
};
```

### GitHub Secrets (para CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: |
          echo "API_KEY=${{ secrets.GOOGLE_API_KEY }}" >> .env
          npm run build
```

---

## 8. Monitoreo y Logs

### Registrar sincronizaciones
```javascript
// En backend
app.post('/api/sync', async (req, res) => {
    const timestamp = new Date().toISOString();
    const user = req.headers['x-user-id'];
    const ip = req.ip;
    
    // Log en servidor
    console.log(`[${timestamp}] Sync de ${user} desde ${ip}`);
    
    // Guardar en base de datos
    await db.collection('sync_logs').insertOne({
        timestamp, user, ip, 
        recordsCount: req.body.length,
        success: true
    });
});
```

### Alertas de seguridad
```javascript
// Si muchos fallos en pocos minutos
if (failureRate > 50%) {
    sendAlert('SECURITY: Posible ataque DoS');
}
```

---

## 9. Comunicación HTTPS Obligatorio

### Configuración
```javascript
// sw.js
if (location.protocol === 'http:' && location.hostname !== 'localhost') {
    console.warn('INSEGURO: App debe ser HTTPS en producción');
}
```

### Netlify/GitHub Pages
- ✅ HTTPS automático
- ✅ HSTS headers
- ✅ Certificados Let's Encrypt

---

## 10. Update de PWA Seguro

```javascript
// sw.js
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// app.js
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                    // Hay actualización disponible
                    console.log('Nueva versión disponible');
                    newSW.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        });
    });
}
```

---

## 📋 Checklist Final

- [ ] `js/config.js` en `.gitignore`
- [ ] Credenciales en variables de entorno (no en código)
- [ ] Backend proxy implementado
- [ ] CORS configurado correctamente
- [ ] CSP headers activos
- [ ] HTTPS obligatorio
- [ ] Tests de seguridad pasados
- [ ] Monitoring en producción
- [ ] Documentación actualizada
- [ ] Backup de Google Sheets habilitado

---

## 🚨 En Caso de Brecha de Seguridad

1. **Inmediato:**
   - [ ] Cambiar API Key en Google
   - [ ] Invalidar Service Worker caché
   - [ ] Revisar logs de acceso
   
2. **Corto plazo:**
   - [ ] Auditoría de código
   - [ ] Implementar nuevas medidas
   - [ ] Comunicar a usuarios afectados
   
3. **Largo plazo:**
   - [ ] Implementar autenticación
   - [ ] Rate limiting
   - [ ] Encriptación end-to-end

---

## 📞 Soporte

Para dudas sobre seguridad, revisar:
- OWASP Top 10
- MDN Web Security
- Google Cloud Security Best Practices
