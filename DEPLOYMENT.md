# 🚀 Guía de Despliegue en Render con Neon PostgreSQL

Esta guía proporciona instrucciones detalladas para desplegar el Sistema de Gestión de Ligas Deportivas en Render usando Neon PostgreSQL como base de datos.

## 📋 Índice

1. [Prerrequisitos](#prerrequisitos)
2. [Configuración de Neon PostgreSQL](#configuración-de-neon-postgresql)
3. [Configuración de Cloudinary](#configuración-de-cloudinary)
4. [Despliegue en Render](#despliegue-en-render)
5. [Variables de Entorno](#variables-de-entorno)
6. [Verificación Post-Despliegue](#verificación-post-despliegue)
7. [Solución de Problemas](#solución-de-problemas)

## 🎯 Prerrequisitos

### Cuentas Necesarias
- [Cuenta en GitHub](https://github.com/) (para el repositorio)
- [Cuenta en Render](https://render.com/) (para el despliegue)
- [Cuenta en Neon](https://neon.tech/) (para la base de datos)
- [Cuenta en Cloudinary](https://cloudinary.com/) (para el almacenamiento de imágenes)

### Herramientas Locales
- Git instalado
- Node.js 18+ (para desarrollo local)

---

## 🐘 Configuración de Neon PostgreSQL

### 1. Crear Cuenta y Proyecto en Neon

1. **Registrarse en Neon**
   ```bash
   # Visita https://neon.tech y regístrate
   # Puedes usar GitHub, Google o email para registrarte
   ```

2. **Crear un Nuevo Proyecto**
   - En el dashboard de Neon, haz clic en "New Project"
   - Dale un nombre descriptivo (ej: `ligasalle-prod`)
   - Selecciona la región más cercana a tus usuarios
   - Haz clic en "Create Project"

3. **Obtener la Cadena de Conexión**
   - Una vez creado el proyecto, copia la cadena de conexión
   - Tendrá un formato similar a:
   ```
   postgresql://neondb_owner:tu_contraseña@ep-tu-host.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

### 2. Configurar la Base de Datos

La estructura de la base de datos se creará automáticamente durante el despliegue gracias a Prisma. Sin embargo, puedes verificar la conexión:

```bash
# Probar la conexión localmente (opcional)
psql "postgresql://neondb_owner:tu_contraseña@ep-tu-host.neon.tech/neondb?sslmode=require"
```

### 3. Características de Neon para Producción

- **Escalado Automático**: Neon escala automáticamente según la demanda
- **Branching**: Puedes crear branches de base de datos para desarrollo
- **Time Travel**: Recuperación de datos a cualquier punto en el tiempo
- **Monitoreo**: Dashboard con métricas de rendimiento

---

## ☁️ Configuración de Cloudinary

### 1. Crear Cuenta en Cloudinary

1. **Registrarse en Cloudinary**
   ```bash
   # Visita https://cloudinary.com y regístrate
   # Puedes usar el plan gratuito que es suficiente para empezar
   ```

2. **Obtener Credenciales**
   - En el dashboard de Cloudinary, ve a "Settings" → "API Keys"
   - Copia los siguientes valores:
     - **Cloud Name**: Tu nombre de cloud
     - **API Key**: Tu clave de API
     - **API Secret**: Tu secreto de API

3. **Configurar Seguridad (Opcional pero recomendado)**
   - En "Settings" → "Security"
   - Configura "Restricted Media Types" si es necesario
   - Habilita "Auto-upload Mapping" para URLs firmadas

---

## 🌐 Despliegue en Render

### 1. Crear Cuenta en Render

1. **Registrarse**
   - Ve a [Render](https://render.com/)
   - Regístrate con tu cuenta de GitHub (recomendado)

### 2. Crear Nuevo Servicio Web

1. **Dashboard de Render**
   - Haz clic en "New +" y selecciona "Web Service"

2. **Conectar Repositorio**
   - Selecciona "Build and deploy from a Git repository"
   - Conecta tu cuenta de GitHub si no está conectada
   - Selecciona el repositorio `ligasalle`
   - Autoriza el acceso

3. **Configuración Básica**
   - **Name**: `ligasalle`
   - **Region**: Selecciona la misma región que tu base de datos Neon
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: 
     ```
     npm install && npx prisma generate && npx prisma db push && npm run build
     ```
   - **Start Command**: 
     ```
     npm run start:render
     ```

4. **Configuración Avanzada**
   - **Instance Type**: `Starter` (puedes actualizar después)
   - **Num Instances**: `1`
   - **Health Check Path**: `/api/health`

### 3. Configurar Variables de Entorno

En la sección "Environment" del servicio, añade las siguientes variables:

| Variable | Valor | Ejemplo |
|----------|-------|---------|
| `DATABASE_URL` | URL de Neon | `postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require` |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary | `tu_cloud_name` |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary | `tu_api_key` |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary | `tu_api_secret` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name público | `tu_cloud_name` |
| `NODE_ENV` | Entorno | `production` |
| `PORT` | Puerto | `10000` |
| `ALLOWED_ORIGINS` | Orígenes permitidos | `https://ligasalle.onrender.com` |

### 4. Iniciar Despliegue

Haz clic en "Create Web Service". Render comenzará automáticamente:

1. **Clonar el repositorio**
2. **Instalar dependencias**
3. **Generar Prisma Client**
4. **Crear tablas en la base de datos**
5. **Construir la aplicación Next.js**
6. **Iniciar el servidor**

El proceso puede tardar 5-15 minutos en el primer despliegue.

---

## 🔧 Variables de Entorno Detalladas

### Variables Obligatorias

#### `DATABASE_URL`
- **Propósito**: Conexión a la base de datos PostgreSQL
- **Formato**: `postgresql://usuario:contraseña@host:puerto/database?sslmode=require&channel_binding=require`
- **Ejemplo Neon**: `postgresql://neondb_owner:abc123@ep-purple-mountain-123456.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Importancia**: CRÍTICA - Sin esta variable la aplicación no funcionará

#### `CLOUDINARY_CLOUD_NAME`
- **Propósito**: Identificador de tu cuenta de Cloudinary
- **Origen**: Dashboard de Cloudinary → Settings → API Keys
- **Importancia**: ALTA - Necesaria para la carga de imágenes

#### `CLOUDINARY_API_KEY`
- **Propósito**: Clave de API para autenticación con Cloudinary
- **Origen**: Dashboard de Cloudinary → Settings → API Keys
- **Importancia**: ALTA - Necesaria para la carga de imágenes

#### `CLOUDINARY_API_SECRET`
- **Propósito**: Secreto de API para autenticación con Cloudinary
- **Origen**: Dashboard de Cloudinary → Settings → API Keys
- **Importancia**: ALTA - Necesaria para la carga de imágenes

#### `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Propósito**: Cloud name accesible desde el frontend
- **Valor**: Igual que `CLOUDINARY_CLOUD_NAME`
- **Importancia**: ALTA - Necesaria para mostrar imágenes en el frontend

#### `NODE_ENV`
- **Propósito**: Define el entorno de ejecución
- **Valores**: `development` o `production`
- **Producción**: `production`
- **Importancia**: ALTA - Afecta el rendimiento y la seguridad

### Variables Opcionales

#### `NEXTAUTH_SECRET`
- **Propósito**: Firmar y cifrar tokens de sesión
- **Generación**: `openssl rand -base64 32`
- **Importancia**: MEDIA - Solo si usas autenticación

#### `NEXTAUTH_URL`
- **Propósito**: URL base para callbacks de autenticación
- **Formato**: URL completa de tu aplicación desplegada
- **Ejemplo**: `https://ligasalle.onrender.com`
- **Importancia**: MEDIA - Solo si usas autenticación

---

## ✅ Verificación Post-Despliegue

### 1. Verificar el Despliegue

Una vez completado el despliegue:

1. **Acceder a la Aplicación**
   - Visita la URL asignada (ej: `https://ligasalle.onrender.com`)
   - Verifica que la página cargue correctamente

2. **Verificar Logs**
   - En el dashboard de Render, ve a "Logs"
   - Revisa que no haya errores críticos
   - Busca mensajes de "Database connected" y "Server ready"

3. **Probar Funcionalidades Básicas**
   - Navega por diferentes páginas
   - Verifica que los estilos carguen correctamente
   - Prueba la carga de imágenes si es posible

### 2. Verificar Base de Datos

1. **Conexión a Neon**
   - Ve al dashboard de Neon
   - Verifica que las tablas se hayan creado correctamente
   - Deberías ver tablas como: `Season`, `League`, `Team`, `Player`, `Match`, etc.

2. **Prueba de API**
   - Accede a `https://tu-app.onrender.com/api/health`
   - Deberías ver una respuesta JSON indicando que el servidor está saludable

### 3. Verificar Cloudinary

1. **Prueba de Carga de Imágenes**
   - Intenta subir un logo de equipo
   - Verifica que la imagen aparezca en el dashboard de Cloudinary
   - Confirma que la imagen se muestre correctamente en la aplicación

---

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```
Error: Can't reach database server at...
```

**Solución:**
- Verifica la URL de `DATABASE_URL`
- Asegúrate de incluir `sslmode=require`
- Verifica que la base de datos Neon esté activa
- Revisa las reglas de firewall en Neon

#### 2. Error de Build de Prisma
```
Error: P3018: A migration failed...
```

**Solución:**
- Verifica que el schema de Prisma sea válido
- Asegúrate de que las dependencias estén instaladas
- Revisa los logs completos del build

#### 3. Error de Cloudinary
```
Error: Cloudinary configuration missing...
```

**Solución:**
- Verifica todas las variables de entorno de Cloudinary
- Asegúrate de que `CLOUDINARY_CLOUD_NAME` y `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` estén configuradas
- Verifica que las credenciales sean correctas

#### 4. Error de Tiempo de Espera
```
Error: Deployment timed out...
```

**Solución:**
- El primer despliegue puede tardar más
- Verifica los logs para ver en qué paso se quedó
- Considera optimizar el build si es muy lento

#### 5. Error de Memoria
```
Error: JavaScript heap out of memory
```

**Solución:**
- En Render, actualiza a un plan con más memoria
- Optimiza las consultas a la base de datos
- Considera implementar paginación

### Comandos Útiles para Debug

#### Verificar Conexión a la Base de Datos
```bash
# Desde tu máquina local (si tienes psql instalado)
psql "postgresql://neondb_owner:tu_pass@ep-tu-host.neon.tech/neondb?sslmode=require"

# Ver tablas
\dt

# Ver conexiones activas
SELECT * FROM pg_stat_activity;
```

#### Verificar Build Localmente
```bash
# Limpiar build anterior
rm -rf .next

# Probar build localmente
npm run build

# Iniciar en modo producción
npm run start:render
```

#### Verificar Logs de Render
```bash
# En el dashboard de Render:
# 1. Selecciona tu servicio
# 2. Haz clic en "Logs"
# 3. Busca errores específicos
```

### Contacto y Soporte

Si encuentras problemas no resueltos:

1. **Revisa esta guía** nuevamente
2. **Consulta la documentación oficial**:
   - [Render Docs](https://render.com/docs)
   - [Neon Docs](https://neon.tech/docs)
   - [Cloudinary Docs](https://cloudinary.com/documentation)
   - [Next.js Docs](https://nextjs.org/docs)
3. **Crea un issue** en el repositorio del proyecto
4. **Contacta al soporte** de Render, Neon o Cloudinary según corresponda

---

## 🎉 ¡Felicidades!

Si has seguido todos los pasos, tu Sistema de Gestión de Ligas Deportivas debería estar desplegado y funcionando en Render con Neon PostgreSQL como base de datos y Cloudinary para el almacenamiento de imágenes.

### Próximos Pasos

1. **Monitorear el rendimiento** usando los dashboards de Render y Neon
2. **Configurar dominio personalizado** si lo deseas
3. **Implementar backup automatizado** (Neon ya incluye backups)
4. **Configurar monitoreo y alertas**
5. **Documentar el proceso** para futuros despliegues

### Recursos Útiles

- [Render Dashboard](https://dashboard.render.com)
- [Neon Console](https://console.neon.tech)
- [Cloudinary Dashboard](https://cloudinary.com/console)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides)

---

**Desarrollado con ❤️ para la gestión deportiva escolar - Colegio La Salle**