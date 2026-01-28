# Troubleshooting PWA en Dispositivos Móviles

## 🔧 Problema: "This site can't be reached" al instalar PWA

### Síntomas
✗ Funciona perfectamente en navegador web  
✗ Se instala como app pero muestra error  
✗ Funciona offline en navegador pero no en app instalada  

---

## 🔍 Causa Raíz

Cuando instalas una PWA en el teléfono, el Service Worker maneja todas las solicitudes. Si las rutas no son absolutas desde root (`/`), pueden fallar. El problema típico:

```javascript
// ❌ PROBLEMA: Rutas relativas
navigator.serviceWorker.register('./sw.js')
const ASSETS = ['./index.html', './js/app.js']

// ✅ SOLUCIÓN: Rutas absolutas desde root
navigator.serviceWorker.register('/sw.js')
const ASSETS = ['/index.html', '/js/app.js']
```

---

## ✅ Soluciones Aplicadas

### 1. **Cambiar Rutas a Absolutas en sw.js**

```javascript
// ANTES ❌
const ASSETS = [
    './',
    './index.html',
    './js/app.js',
    ...
];

// AHORA ✅
const ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    ...
];
```

### 2. **Mejorar Registro del Service Worker**

```javascript
// ANTES ❌
navigator.serviceWorker.register('./sw.js')
    .then(reg => console.log('SW registrado'))
    .catch(err => console.log('Error SW', err));

// AHORA ✅
navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(reg => {
        console.log('[✓] Service Worker registrado correctamente');
        console.log('[✓] Scope:', reg.scope);
    })
    .catch(err => {
        console.error('[✗] Error registrando Service Worker:', err);
        console.error('[✗] Detalles:', err.message);
    });
```

---

## 🧪 Cómo Testear en Teléfono

### Opción 1: Chrome DevTools Remote Debugging

```bash
# En Windows (desde terminal)
# 1. Conectar teléfono por USB
# 2. Habilitar "Developer Options" en teléfono
# 3. En Chrome desktop: chrome://inspect
# 4. Ver dispositivo conectado
# 5. Ver pestaña de la app PWA
# 6. F12 en pestaña para inspeccionar
```

### Opción 2: Verificar Manualmente

1. Abrir app instalada en teléfono
2. Abrir console (Chrome → ⋮ → More tools → Developer tools)
3. Buscar mensajes:
   ```
   ✓ [✓] Service Worker registrado correctamente
   ✓ [✓] Scope: /
   ```

---

## 🚀 Deploy la Solución

```bash
# 1. Desde terminal en la carpeta del proyecto
git add -A
git commit -m "fix: corregir rutas PWA para dispositivos móviles"
git push origin main

# 2. Vercel auto-deploya
# Esperar 2-3 minutos

# 3. Desinscribir app antigua del teléfono
# Settings → Apps → Baterías → Desinstalar

# 4. Abrir en navegador del teléfono
# https://inspeccion-baterias-xxx.vercel.app

# 5. Instalar de nuevo (Chrome → Menu → Install app)
```

---

## 📋 Checklist de Diagnóstico

Si sigue sin funcionar:

```
□ En navegador del teléfono:
  - Abrir DevTools (Chrome Menu → More tools)
  - Buscar errores en Console
  - Ir a Application → Service Workers
  - Verificar que Status = "activated"
  
□ Si Service Worker no se activa:
  - Limpiar caché: Chrome → Settings → Clear browsing data
  - Desinstalar app: Settings → Apps → Baterías → Desinstalar
  - Reinstalar desde navegador
  
□ Si aún tiene errores:
  - Revisar errores específicos en Console
  - Captura de pantalla del error
  - Compartir con soporte técnico
```

---

## 🔍 Mensajes de Error Comunes y Soluciones

### Error: "Failed to register a ServiceWorker"

```
Causa: Rutas incorrectas o archivo sw.js no encontrado
Solución: Verificar que sw.js existe y está en root
Comando: curl https://inspeccion-baterias-xxx.vercel.app/sw.js
```

### Error: "Scope is not under the ServiceWorker's scope"

```
Causa: Mismatch entre scope declarado y actual
Solución: Asegurar que scope es '/' (YA CORREGIDO)
```

### Error: "Cannot read property 'location' of undefined"

```
Causa: Service Worker context no inicializado
Solución: NO deberías verlo con la corrección aplicada
Verificar: DevTools → Service Workers → State
```

---

## 📱 Testing en Diferentes Dispositivos

### Android Chrome
```
1. Chrome → Menu (⋮)
2. Click "Install app"
3. Permitir notificaciones
4. App instalada en home screen
5. Click para abrir
6. DevTools: Chrome → Inspect via DevTools
```

### iOS Safari
```
1. Safari → Share ⬆️
2. "Add to Home Screen"
3. Nombre de la app
4. "Add"
5. App instalada en home screen
6. Abrir desde home screen
7. No hay DevTools directa, pero consultar logs en iCloud
```

### Android Firefox
```
1. Firefox → Menu (⋮)
2. "Install"
3. "Install" confirmación
4. App instalada
```

---

## 🔄 Qué Cambió

| Elemento | Antes | Ahora |
|----------|-------|-------|
| sw.js assets | `./index.html` | `/index.html` |
| Registro SW | `./sw.js` | `/sw.js` |
| Scope | Implícito | `{ scope: '/' }` |
| Error logging | Mínimo | Detallado |

---

## ✨ Resultado Esperado

Después de la corrección:

✅ App funciona en navegador web  
✅ App se instala correctamente  
✅ App funciona como app nativa instalada  
✅ Funciona offline en ambos casos  
✅ Service Worker se activa correctamente  
✅ Console no muestra errores  

---

## 📞 Si Persisten Problemas

1. **Limpiar todo:**
   ```
   Teléfono: Settings → Apps → Storage → Delete app data
   Caché: Settings → Apps → Storage → Clear cache
   Desinstalar completamente
   Esperar 1 hora
   Reinstalar
   ```

2. **Verificar en Desktop primero:**
   ```
   Chrome DevTools F12 → Application → Service Workers
   Confirmar que está "activated and running"
   ```

3. **Contactar soporte con:**
   - Screenshots del error
   - Modelo del dispositivo
   - Versión del navegador
   - Logs de console (F12)
   - URL del sitio

