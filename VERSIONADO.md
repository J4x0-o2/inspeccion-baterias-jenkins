# 📦 Estrategia de Versionado Automático

Este documento explica cómo funciona el versionado automático de la app.

## 🎯 Concepto

**Cada push a `master` automáticamente:**
1. Analiza el tipo de cambio en el commit message
2. Incrementa la versión en `package.json`
3. Crea un tag de Git (v1.2.0)
4. Crea un Release en GitHub
5. Despliega a Vercel con la nueva versión

## 📝 Tipos de Commits

Usa **Conventional Commits** para que el sistema entienda qué tipo de cambio es:

### 🆕 MINOR (Nueva Feature)
```bash
git commit -m "feat: agregar nueva sección de reportes"
git commit -m "feature: modal para configurar referencias"
```
**Resultado**: v1.2.0 → v1.3.0 (incremente MINOR)

### 🐛 PATCH (Bug Fix)
```bash
git commit -m "fix: corregir error en sincronización"
git commit -m "fix: arreglar validación de fórmula"
```
**Resultado**: v1.2.0 → v1.2.1 (incremente PATCH)

### 🔧 PATCH (Refactor/Mantenimiento)
```bash
git commit -m "refactor: eliminar código duplicado"
git commit -m "chore: actualizar documentación"
git commit -m "style: mejorar formato HTML"
git commit -m "ci: actualizar workflows"
```
**Resultado**: v1.2.0 → v1.2.1 (incremente PATCH)

### 🚨 MAJOR (Breaking Changes)
```bash
git commit -m "breaking: cambiar estructura de localStorage"
git commit -m "BREAKING CHANGE: eliminar soporte para versión 1.x"
```
**Resultado**: v1.2.0 → v2.0.0 (incremente MAJOR)

## 📊 Ejemplos de Flujo

### Escenario 1: Arreglar un bug

```bash
# 1. En rama develop/feature
git checkout -b fix/error-modal
nano js/app.js          # Editar código
git add .
git commit -m "fix: modal no se cierra correctamente"

# 2. Hacer PR a master

# 3. GitHub Actions automáticamente:
#    ✅ Valida código
#    ✅ Crea Preview URL
#    ✅ Te deja revisar

# 4. Haces merge en GitHub

# 5. GitHub Actions automáticamente:
#    ✅ Detecta: "fix: modal..."
#    ✅ Incrementa: v1.2.0 → v1.2.1
#    ✅ Crea tag: v1.2.1
#    ✅ Crea Release en GitHub
#    ✅ Despliega a Vercel
#    ✅ Tu app está en PROD con v1.2.1
```

### Escenario 2: Nueva feature

```bash
# 1. Crear rama feature
git checkout -b feat/reportes-avanzados
nano index.html         # Agregar nueva sección
git add .
git commit -m "feat: agregar sección de reportes con gráficos"

# 2. PR a master → Merge

# 3. GitHub Actions automáticamente:
#    ✅ Detecta: "feat: agregar..."
#    ✅ Incrementa: v1.2.0 → v1.3.0 (MINOR)
#    ✅ Crea Release
#    ✅ Despliega a Vercel

# Resultado: Nueva versión es v1.3.0
```

### Escenario 3: Refactoring/Limpieza

```bash
# 1. Refactoring
git commit -m "refactor: eliminar referencias duplicadas en app.js"

# 2. Merge a master

# 3. GitHub Actions:
#    ✅ Detecta: "refactor"
#    ✅ Incrementa: v1.2.0 → v1.2.1 (PATCH)
#    ✅ Etiqueta como: "mantenimiento"
```

## 🔍 ¿Cómo Funciona Internamente?

```
Tu commit message
       ↓
GitHub Actions lee el mensaje
       ↓
Busca palabras clave:
  - "feat/feature" → MINOR
  - "fix/hotfix" → PATCH
  - "refactor/style/chore/ci" → PATCH
  - "breaking/BREAKING" → MAJOR
       ↓
Calcula nueva versión
       ↓
Actualiza package.json
       ↓
Crea Git tag
       ↓
Crea Release en GitHub
       ↓
Despliega a Vercel
```

## 📝 Formato de Commit Recomendado

Para máxima claridad, usa este formato:

```
<tipo>(<scope>): <descripción breve>

<descripción detallada (opcional)>

Fixes #123
```

### Ejemplos:

```bash
git commit -m "feat(modal): agregar validación de referencias"
git commit -m "fix(sync): corregir error de sincronización offline"
git commit -m "refactor(app): eliminar código duplicado en abrirModal"
git commit -m "docs: actualizar README con instrucciones CI/CD"
git commit -m "chore(deps): actualizar dependencias"
```

## 🏷️ Versiones Creadas Automáticamente

Cuando haces un push, se crean:

### 1. Git Tag
```bash
v1.2.0  # Visible en: repo → Tags
v1.2.1
v1.3.0
v2.0.0
```

### 2. GitHub Release
```
Visible en: repo → Releases

Ejemplo:
  v1.2.1 [PATCH]
  
  📝 Fixes modal que no se cierra
  🔑 Commit: abc123def
  👤 Autor: tu-usuario
  
  [Release Notes automático]
```

### 3. Package.json Actualizado
```json
{
  "name": "inspeccion-baterias",
  "version": "1.2.1",  // ← Automáticamente actualizado
  ...
}
```

## ✨ Ventajas del Versionado Automático

✅ **Consistencia** - Nunca olvidas actualizar la versión
✅ **Trazabilidad** - Cada versión está taggada en Git
✅ **Automatización** - Sin pasos manuales
✅ **Documentación** - Releases creados automáticamente
✅ **Reversibilidad** - Fácil volver a versión anterior con `git checkout v1.2.0`

## 🔄 Versionado Semántico (SemVer)

La app sigue **Semantic Versioning** 2.0.0:

```
MAJOR.MINOR.PATCH

v2.0.0
 │ │ └─ PATCH: Arreglos sin cambios de API
 │ └─── MINOR: Nuevas features, compatibles
 └───── MAJOR: Cambios incompatibles
```

### Ejemplos:

| Cambio | Versión anterior | Versión nueva | Razón |
|--------|-----------------|---------------|-------|
| Bug fix | 1.2.0 | **1.2.1** | PATCH |
| Nueva feature | 1.2.0 | **1.3.0** | MINOR |
| Refactor | 1.2.0 | **1.2.1** | PATCH |
| Breaking change | 1.2.0 | **2.0.0** | MAJOR |

## 🚀 Ver Versiones en Vercel

Cada deployment en Vercel incluye la versión:

```
En Vercel Dashboard:
Deployments → Click en un deployment
  ↓
Environment variables:
  APP_VERSION=1.2.1
```

## 📱 Ver Versión en la App

Para mostrar la versión en la app (opcional):

```javascript
// En config.js
const APP_VERSION = "1.2.1";

// En HTML
<footer>
  <p>App v<span id="version">1.2.1</span></p>
</footer>

// En JavaScript
document.getElementById('version').textContent = APP_VERSION;
```

## ⚠️ Reglas Importantes

1. **Commit messages en inglés** - Facilita búsquedas internacionales
2. **Tipo en minúsculas** - `feat:` no `Feat:`
3. **Descripción clara** - No hagas `fix: bug` (¿cuál bug?)
4. **Una línea de resumen** - Máximo 72 caracteres
5. **Breaking changes mencionados** - Si cambias la API

## 📊 Historial de Versiones

Puedes ver el historial en:

```bash
# En terminal
git log --oneline --all --decorate --graph

# En GitHub
repo → Commits o Releases

# En Vercel
Dashboard → Deployments
```

## 🎓 Resumen

```
FLUJO SIMPLE:

1. Haces cambios en código
2. Haces commit con mensaje claro (feat, fix, etc)
3. Haces push a develop → desarrollas
4. Haces PR develop → master
5. Merge a master
6. GitHub Actions automáticamente:
   ✅ Lee commit message
   ✅ Calcula versión nueva
   ✅ Actualiza package.json
   ✅ Crea tag y release
   ✅ Despliega a Vercel

7. ¡Tu app está con nueva versión en PROD!

TODO AUTOMÁTICO 🚀
```

---

**Recuerda:** La próxima vez que hagas push a master, GitHub Actions automáticamente versionará tu app. ¡Sin hacer nada manual!
