# Inspección de Baterías - Sistema de Registro Corporativo

**Versión:** 1.0.0  
**Última actualización:** Enero 27, 2026  
**Estado:** Production ✅

---

## 📋 Descripción General

Sistema PWA (Progressive Web Application) enterprise para el registro, inspección y sincronización de baterías con Google Sheets. Desarrollado con enfoque offline-first, permitiendo funcionalidad completa incluso sin conexión a internet.

### Características Principales

✅ **Funcionamiento Offline** - Sincronización automática con Google Sheets cuando hay conexión  
✅ **Almacenamiento Local** - IndexedDB para persistencia de datos  
✅ **Contador Automático** - Sistema de conteo con reinicio cada 24 horas  
✅ **Carga de Referencias** - Importación de catálogo de baterías  
✅ **PWA Completa** - Instalable en dispositivos móviles y desktop  
✅ **Interfaz Responsive** - Adaptable a cualquier tamaño de pantalla  
✅ **Service Worker** - Caché inteligente con estrategia offline-first  

---

## 🎯 Objetivos del Proyecto

1. Facilitar el registro de inspecciones de baterías en campo sin requerir conexión permanente
2. Garantizar la integridad y persistencia de datos localmente
3. Sincronizar automáticamente con Google Sheets cuando hay conectividad
4. Proporcionar experiencia PWA instalable para uso en dispositivos móviles
5. Mantener seguridad de credenciales sensibles mediante variables de entorno

---

## 📁 Estructura del Proyecto

```
inspeccion-baterias/
├── index.html                  # Interfaz principal
├── manifest.json              # Configuración PWA
├── sw.js                       # Service Worker (caché y offline)
├── vercel.json                # Configuración de deployment
├── package.json               # Dependencias Node.js
│
├── js/                         # Lógica de frontend
│   ├── app.js                 # Gestión de formularios y UI
│   ├── database.js            # Operaciones IndexedDB
│   ├── sync.js                # Sincronización con Google Sheets
│   ├── api.js                 # Llamadas a APIs
│   ├── config.js              # Configuración sensible
│   └── referencias-sync.js    # Carga de referencias
│
├── api/                        # Endpoints serverless (Vercel)
│   ├── send-to-sheets.js      # POST a Google Sheets
│   └── referencias.js         # GET de referencias
│
├── images/                     # Activos visuales
│   └── battery-icon.png       # Icono de la app
│
└── documentacion/              # Esta carpeta
    ├── 01_README.md
    ├── 02_ARQUITECTURA.md
    ├── 03_SEGURIDAD.md
    ├── 04_INSTALACION.md
    ├── 05_DESARROLLO.md
    ├── 06_DEPLOYMENT.md
    └── 07_ARCHIVOS.md
```

---

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/J4x0-o2/inspeccion-baterias.git
cd inspeccion-baterias

# Instalar dependencias
npm install

# Crear archivo .env con variables sensibles
# Ver documentación de instalación
```

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder en http://localhost:8888
```

### Deployment

```bash
# Deploy a producción
npm run deploy

# O manualmente en Vercel
vercel --prod
```

---

## 🔐 Seguridad

- **Credenciales en Variables de Entorno:** No se expongan URLs de Google Apps Script en código fuente
- **Service Worker:** Caché offline-first con estrategia network-first para APIs
- **IndexedDB:** Almacenamiento local encriptado de datos de usuario
- **HTTPS:** Requerido en producción para Service Worker

⚠️ Ver [03_SEGURIDAD.md](03_SEGURIDAD.md) para detalles completos

---

## 📊 Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Frontend | HTML5, CSS3 (Tailwind), JavaScript ES6+ |
| Almacenamiento | IndexedDB, LocalStorage |
| Offline | Service Worker |
| Sync | Google Apps Script |
| Backend | Vercel Serverless Functions (Node.js) |
| Hosting | Vercel |
| UI/CSS | Tailwind CSS 3 |

---

## 📞 Soporte y Contacto

Para reportar problemas o sugerencias:
- GitHub Issues: [J4x0-o2/inspeccion-baterias](https://github.com/J4x0-o2/inspeccion-baterias)
- Email: [contacto@empresa.com]

---

## 📜 Licencia

Proyecto corporativo - Derechos reservados 2026

---

## 📚 Documentación Completa

- [Arquitectura del Sistema](02_ARQUITECTURA.md)
- [Seguridad y Credenciales](03_SEGURIDAD.md)
- [Instalación y Setup](04_INSTALACION.md)
- [Guía de Desarrollo](05_DESARROLLO.md)
- [Deployment y DevOps](06_DEPLOYMENT.md)
- [Referencia de Archivos](07_ARCHIVOS.md)

