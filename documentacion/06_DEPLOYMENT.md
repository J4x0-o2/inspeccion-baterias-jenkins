# Deployment y DevOps

## 🚀 Pipeline de Deployment

```
┌──────────────────────────────────────────────────────────┐
│              DESARROLLO LOCAL                            │
│         (npm run dev en tu máquina)                      │
└────────────────┬─────────────────────────────────────────┘
                 │ git push origin feature-branch
                 │
┌────────────────▼─────────────────────────────────────────┐
│              GITHUB REPOSITORY                           │
│         (Almacenamiento de código)                       │
└────────────────┬─────────────────────────────────────────┘
                 │ Pull Request → Code Review → Merge to main
                 │
┌────────────────▼─────────────────────────────────────────┐
│          VERCEL (Auto-Deploy)                            │
│     Detecta push a main → Build → Deploy                │
└────────────────┬─────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼────┐      ┌────▼──────┐
    │ Preview │      │ Production│
    │  Build  │      │   Build   │
    └────┬────┘      └────┬──────┘
         │                │
    ┌────▼────────────────▼────┐
    │  Testing & Validation     │
    │  • Healthchecks           │
    │  • API endpoints          │
    │  • Google Sheets sync     │
    └────┬─────────────────────┘
         │
    ┌────▼────────────────────┐
    │  LIVE PRODUCTION         │
    │  https://inspeccion-    │
    │  baterias-xxx.vercel.app│
    └──────────────────────────┘
```

---

## 📋 Configuración de Vercel

### vercel.json - Configuración Global

```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "cleanUrls": true
}
```

**Explicación:**
- `buildCommand: ""` → No hay build step (sitio estático)
- `outputDirectory: "."` → Root es el output
- `cleanUrls: true` → URLs sin .html

### Environment Variables

Configuradas en Vercel Dashboard:

```
Variable: GOOGLE_SHEET_URL
Value: https://script.google.com/macros/s/AKfycbxxkhNdwTpGrx1DYsi3nW085n2ehU0hICKzTu-B4v89Il0Ghru5cjiDCRJ_6Tsd1kI3/exec
Environments: Production, Preview, Development
```

---

## 🔄 Tipos de Deployment

### 1. Preview Deployment (Automático)

Se genera automáticamente cuando:
- Haces push a cualquier rama (excepto main)
- Abres Pull Request
- Vercel crea URL temporal: `https://inspeccion-baterias-{hash}.vercel.app`

**Uso:** Testing en servidor antes de merge

```bash
git checkout -b feature/test
git push origin feature/test
# → Vercel crea URL de preview automáticamente
# → Testear cambios en servidor
# → Si está bien → Merge a main
```

### 2. Production Deployment (Main Branch)

Se dispara cuando:
- Mergeás a main branch
- O ejecutas `vercel --prod` manualmente

```bash
# Opción A: Automático (push a main)
git push origin main
# Vercel detecta cambios y deploya automáticamente

# Opción B: Manual
vercel --prod
```

### 3. Scheduled Deployments

Para redeploys periódicos (limpieza de caché, actualizaciones):

```bash
# Forzar redeploy sin cambios de código
vercel --prod --force
```

---

## 📊 Monitoreo y Logs

### Logs en Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Ver logs de deployment
vercel logs inspeccion-baterias

# Ver logs en tiempo real
vercel logs inspeccion-baterias --follow

# Ver logs de API específica
vercel logs inspeccion-baterias/api/send-to-sheets
```

### Analizar Errores

```bash
# Ver errores recientes
vercel logs inspeccion-baterias --limit 100

# Buscar por timestamp
vercel logs inspeccion-baterias --since 2026-01-27T10:00:00Z

# Descargar logs para análisis
vercel logs inspeccion-baterias > logs.txt
```

---

## 🔐 Manejo de Secretos

### Variables de Entorno (Seguras)

✅ **CORRECTO:** Secretos en Vercel Environment Variables
```
Dashboard → Settings → Environment Variables
GOOGLE_SHEET_URL = https://script.google.com/...
```

✅ **CORRECTO:** Diferentes valores por environment
```
Production:    https://script.google.com/macros/s/PROD_ID/exec
Preview:       https://script.google.com/macros/s/PREVIEW_ID/exec
Development:   https://script.google.com/macros/s/DEV_ID/exec
```

❌ **INCORRECTO:** Hardcodear secretos en código
```javascript
const URL = "https://script.google.com/macros/s/SECRET/exec"; // ❌ NO
```

### Rotation de Secretos

Si necesitas cambiar Google Apps Script URL:

```
1. Google Apps Script → Deploy → New deployment
2. Copiar nueva URL
3. Vercel Dashboard → Settings → Environment Variables
4. Editar GOOGLE_SHEET_URL
5. Seleccionar todos los environments
6. Guardar → Auto redeploy
```

---

## 🚨 Rollback en Caso de Problemas

### Opción 1: Revert Git (Recomendado)

```bash
# Ver historial de commits
git log --oneline

# Revertir último commit
git revert HEAD
git push origin main

# Vercel auto-deploya con revert
# La app vuelve a versión anterior
```

### Opción 2: Usar Deployment Anterior

```bash
# En Vercel Dashboard:
1. Ir a Project → Deployments
2. Ver historial de deployments
3. Hacer click en deployment anterior
4. Click "Promote to Production"
```

### Opción 3: Rollback Inmediato

```bash
# Forzar redeploy de branch anterior
git checkout main
git reset --hard HEAD~1
vercel --prod --force
```

---

## 📈 Performance y Optimización

### Análisis de Tamaño

```bash
# Ver tamaño de assets
ls -lh index.html js/*.js api/*.js

# Vercel proporciona análisis en Dashboard
# Settings → Analytics & Insights
```

### Optimizaciones Implementadas

```
✓ CSS inline en index.html (Tailwind)
✓ JavaScript no minificado pero es pequeño
✓ Service Worker cachea assets locales
✓ Google Sheets API cachea referencias
✓ IndexedDB para datos locales (no requiere red)
```

### Monitoreo de Performance

```bash
# En Vercel Dashboard:
1. Analytics → Web Vitals
2. Ver Core Web Vitals
3. Identificar cuellos de botella
4. Optimizar si es necesario
```

---

## ✅ Checklist de Deployment

### Antes de Hacer Push a Main

```bash
□ Código compilado sin errores
□ Testeado localmente (npm run dev)
□ Verificados cambios (git diff)
□ Commits con mensajes descriptivos
□ No hay console.log de debug
□ No hay variables hardcodeadas
□ HTTPS verificado en producción
□ Variables de entorno configuradas en Vercel
□ Branches mergeadas a main
```

### Después del Deployment

```bash
□ Verificar que https://inspeccion-baterias-xxx.vercel.app funciona
□ Llenar formulario de prueba
□ Verificar que se guardó en Google Sheets
□ Verificar Service Worker registrado (DevTools)
□ Verificar PWA instalable
□ Test de funcionalidad offline
□ Revisar logs en Vercel
□ No hay errores en console del navegador
```

---

## 🔍 Troubleshooting

### Build Falla en Vercel

```
Error: npm install failed

Solución:
1. Verificar package.json tiene sintaxis correcta
2. Eliminar node_modules localmente
3. Ejecutar npm install localmente
4. Commitear package-lock.json actualizado
5. Push a main y Vercel reintentar
```

### API Returns 500

```
Error: GOOGLE_SHEET_URL no configurada

Solución:
1. Vercel Dashboard → Settings → Environment Variables
2. Verificar GOOGLE_SHEET_URL está agregada
3. Copiar URL exacta de Google Apps Script
4. Redeploy: vercel --prod
5. Esperar 2 minutos para que tome efecto
```

### Service Worker No Funciona

```
Error: sw.js no se registra

Solución:
1. Verificar HTTPS en producción
2. Verificar sw.js es accesible: curl https://inspeccion-baterias-xxx.vercel.app/sw.js
3. Limpiar caché del navegador
4. Abrir en pestaña incógnita
5. Revisar console para errores de CORS
```

### Funcionalidad Offline Rota

```
Problema: Registro no se sincroniza después de online

Solución:
1. DevTools → Application → IndexedDB
   Verificar que hay registros con "sincronizado: false"
2. Console ejecutar: sync.sincronizarPendiente()
3. Verificar logs: vercel logs inspeccion-baterias
4. Si hay error → Revisar Google Apps Script
```

---

## 📞 Soporte en Producción

### Monitoreo 24/7

```
Verificar estado:
- https://status.vercel.com (Estado de Vercel)
- Vercel Dashboard → Analytics
- Logs automáticos: vercel logs inspeccion-baterias
```

### Escalation en Caso de Downtime

```
1. Verificar si es problema de Vercel
   → Revisar status.vercel.com
   → Esperar resolución de Vercel

2. Si es problema de la app
   → Revisar vercel logs
   → Hacer rollback si es necesario
   → Notificar a equipo

3. Si es problema de Google Sheets
   → Verificar Google Cloud Status
   → Considerar BD alternativa
```

---

## 🔄 CI/CD Mejoras Futuras

### Automated Testing

```javascript
// Agregar tests unitarios
npm install --save-dev jest

// Test app.js
test('incrementarContador increments by 1', () => {
  const actual = 5;
  const expected = 6;
  expect(incrementarContador(actual)).toBe(expected);
});
```

### Pre-deployment Checks

```bash
# .git/hooks/pre-push
#!/bin/bash
npm run test
npm run lint
if [ $? -ne 0 ]; then
  echo "Tests fallaron. No se puede hacer push."
  exit 1
fi
```

### Automated Rollback

```bash
# Si healthcheck falla después de deploy
if ! curl -f https://inspeccion-baterias-xxx.vercel.app; then
  vercel rollback
  send_notification "Rollback automático ejecutado"
fi
```

---

## 📚 Referencias

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Deployments](https://vercel.com/docs/concepts/deployments/overview)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Using Vercel CLI](https://vercel.com/cli)

