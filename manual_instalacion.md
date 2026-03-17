# Manual de Instalación — SGE-UNT

**Sistema de Gestión de Egresados — Universidad Nacional de Trujillo**

---

## 1. Introducción

### 1.1 Descripción del sistema

El **SGE-UNT** es una aplicación web full stack desarrollada para la Universidad Nacional de Trujillo, orientada a la gestión integral de egresados. El sistema permite el registro y actualización de perfiles profesionales, la publicación y postulación a ofertas laborales con matching por habilidades, el seguimiento de empleabilidad mediante encuestas y dashboards, y una red de mentores para orientación profesional.

La arquitectura del sistema es **modular**: consta de cuatro módulos independientes (cada uno con su propio backend y frontend), que comparten una única base de datos PostgreSQL y código común (configuración de BD, middleware de autenticación y manejo de errores).

### 1.2 Objetivo del manual

Este manual tiene como objetivo guiar al instalador o administrador técnico en la **instalación, configuración y puesta en marcha** del SGE-UNT en un entorno de desarrollo o producción, ya sea mediante Docker o de forma manual. Se incluyen requisitos, pasos detallados, verificación del funcionamiento y soluciones a problemas frecuentes.

---

## 2. Requisitos del sistema

### 2.1 Software necesario

| Componente        | Descripción                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| **Node.js**       | Entorno de ejecución JavaScript para los backends y herramientas de frontend. |
| **npm**           | Gestor de paquetes de Node.js (incluido con Node.js).                       |
| **PostgreSQL**    | Base de datos relacional donde se almacenan todos los datos del sistema.    |
| **Git**           | Opcional; necesario solo si se clona el repositorio desde control de versiones. |
| **Docker** (opcional) | Docker Engine y Docker Compose para despliegue con contenedores.         |

### 2.2 Versiones recomendadas

- **Node.js:** 20.x o superior (LTS recomendado).
- **npm:** 10.x o superior (viene con Node.js 20+).
- **PostgreSQL:** 16.x.
- **Docker:** última versión estable (si se usa instalación con Docker).
- **Docker Compose:** v2.x o superior (si se usa instalación con Docker).

### 2.3 Sistema operativo

- **Windows:** 10/11 (PowerShell o terminal compatible).
- **macOS:** versiones recientes (terminal o iTerm2).
- **Linux:** distribuciones recientes (Ubuntu 20.04+, Debian, Fedora, etc.).

En todos los casos se asume acceso a una terminal o línea de comandos para ejecutar los pasos descritos.

---

## 3. Estructura del proyecto

El proyecto está organizado en carpetas por módulo y recursos compartidos:

```
[raíz del proyecto]/
├── package.json                 # Scripts globales (install:all, dev, dev:all)
├── docker-compose.yml           # Orquestación de servicios (PostgreSQL + 4 backends + 4 frontends)
├── README.md                    # Resumen rápido y credenciales
├── manual_instalacion.md        # Este manual
├── manual_usuario.md            # Manual de usuario
│
├── database/                    # Scripts de base de datos
│   ├── init/
│   │   └── 01_init.sql          # Creación de esquemas, tablas, índices y datos iniciales
│   ├── seed01.sql               # Datos de prueba adicionales (opcional)
│   └── seed02.sql               # Datos de prueba adicionales (opcional)
│
├── shared/                      # Código compartido entre módulos
│   ├── config/                  # Configuración compartida (ej. conexión BD)
│   ├── middleware/              # Middlewares Express (auth, errorHandler)
│   └── frontend/
│       └── components/          # Componentes React compartidos (ej. Navbar)
│
├── modulo-1-registro/           # Módulo 1: Registro y Perfil de Egresados
│   ├── backend/                 # API REST (Express) — puerto 3001
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── server.js
│   │   ├── .env.example
│   │   └── package.json
│   └── frontend/                # Aplicación React (Vite) — puerto 5173 (punto de entrada principal)
│       ├── src/
│       │   ├── App.jsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── services/
│       │   └── hooks/
│       └── package.json
│
├── modulo-2-bolsa/              # Módulo 2: Bolsa Laboral
│   ├── backend/                 # API — puerto 3002
│   └── frontend/                # React — puerto 5174
│
├── modulo-3-seguimiento/        # Módulo 3: Seguimiento de Empleabilidad
│   ├── backend/                 # API — puerto 3003
│   └── frontend/                # React — puerto 5175
│
└── modulo-4-mentores/           # Módulo 4: Red de Mentores
    ├── backend/                 # API — puerto 3004
    └── frontend/                # React — puerto 5176
```

**Resumen de puertos:**

| Servicio              | Puerto (desarrollo) | Descripción                    |
|-----------------------|--------------------|--------------------------------|
| Backend Módulo 1      | 3001               | Registro, perfil, auth, admin |
| Backend Módulo 2      | 3002               | Ofertas, postulaciones, match |
| Backend Módulo 3      | 3003               | Encuestas, dashboard, reportes |
| Backend Módulo 4      | 3004               | Mentores, mentoría, sesiones  |
| Frontend Módulo 1     | 5173               | Aplicación principal (acceso a todos los módulos) |
| Frontend Módulo 2     | 5174               | Interfaz específica bolsa     |
| Frontend Módulo 3     | 5175               | Interfaz seguimiento          |
| Frontend Módulo 4     | 5176               | Interfaz mentores             |
| PostgreSQL            | 5432               | Base de datos                 |

---

## 4. Instalación paso a paso

### 4.1 Clonar el repositorio

1. Si el proyecto está en un repositorio Git, clonar en la carpeta deseada:

   ```bash
   git clone <URL_DEL_REPOSITORIO> egresados_unt
   cd egresados_unt
   ```

2. Si se recibe el proyecto como archivo comprimido (ZIP), descomprimirlo y abrir una terminal en la carpeta raíz del proyecto (donde se encuentra `package.json` y `docker-compose.yml`).

---

### 4.2 Configuración del backend

Cada módulo tiene su propio backend. Los pasos son equivalentes para los cuatro; solo cambian el puerto y la ruta.

#### 4.2.1 Instalación de dependencias

Desde la **raíz del proyecto**, se pueden instalar todas las dependencias de una vez:

```bash
npm install
npm run install:all
```

`install:all` ejecuta `npm install` dentro de cada carpeta `modulo-*/backend` y `modulo-*/frontend`.

**Instalación manual por módulo (ejemplo Módulo 1):**

```bash
cd modulo-1-registro/backend
npm install
```

Repetir para:

- `modulo-2-bolsa/backend`
- `modulo-3-seguimiento/backend`
- `modulo-4-mentores/backend`

#### 4.2.2 Variables de entorno (.env)

Cada backend requiere un archivo `.env` en su carpeta. Se puede partir del archivo de ejemplo:

**Módulo 1** (`modulo-1-registro/backend/`):

```bash
cp .env.example .env
```

Contenido típico del `.env` (ajustar según entorno):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=egresados_unt
DB_USER=postgres
DB_PASSWORD=sa
JWT_SECRET=sge_unt_secret_key_2024
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Módulos 2, 3 y 4:** mismo proceso en cada `modulo-*-/backend/`, cambiando solo:

- `PORT=3002` (Módulo 2), `PORT=3003` (Módulo 3), `PORT=3004` (Módulo 4).
- `CORS_ORIGIN` si se usan otros orígenes (ej. `http://localhost:5174`, etc.).

En **Docker**, `DB_HOST` debe ser `postgres` (nombre del servicio en `docker-compose`).

#### 4.2.3 Configuración de la base de datos

La conexión a la base de datos se hace mediante las variables `DB_*`. No hay archivo de configuración adicional: cada backend usa su propio `config/database.js` (o equivalente) que lee estas variables. Asegurarse de que PostgreSQL esté instalado, que exista la base de datos `egresados_unt` y que el usuario tenga permisos (ver sección 4.3).

---

### 4.3 Configuración de PostgreSQL

#### 4.3.1 Creación de la base de datos

1. Tener PostgreSQL 16 instalado y el servicio en ejecución.
2. Conectar con un usuario con permisos de creación de bases de datos (por ejemplo `postgres`) y ejecutar:

   ```bash
   psql -U postgres -c "CREATE DATABASE egresados_unt;"
   ```

   En Windows, si `psql` no está en el PATH, usar la ruta completa de instalación de PostgreSQL o la consola que trae el instalador.

#### 4.3.2 Ejecución de scripts SQL

1. **Script principal (obligatorio):** crea esquemas, tablas, índices, triggers y datos iniciales (facultades, escuelas, habilidades, usuario admin, empresas de prueba, ofertas, encuestas, etc.):

   ```bash
   psql -U postgres -d egresados_unt -f database/init/01_init.sql
   ```

2. **Seeds opcionales:** para cargar más datos de prueba (egresados, postulaciones, mentores, etc.):

   ```bash
   psql -U postgres -d egresados_unt -f database/seed01.sql
   psql -U postgres -d egresados_unt -f database/seed02.sql
   ```

   El orden recomendado es: `01_init.sql` → `seed01.sql` → `seed02.sql`.

#### 4.3.3 Usuario y contraseña

El script y el README del proyecto asumen usuario `postgres` y contraseña `sa` en desarrollo. Si en su entorno se usa otro usuario o contraseña, debe reflejarse en el `.env` de cada backend (`DB_USER`, `DB_PASSWORD`).

---

### 4.4 Configuración del frontend

#### 4.4.1 Instalación de dependencias

Desde la raíz del proyecto:

```bash
npm run install:all
```

O, por cada frontend:

```bash
cd modulo-1-registro/frontend && npm install
cd modulo-2-bolsa/frontend && npm install
cd modulo-3-seguimiento/frontend && npm install
cd modulo-4-mentores/frontend && npm install
```

#### 4.4.2 Variables necesarias

Los frontends construidos con Vite pueden usar variables de entorno con el prefijo `VITE_`. Por ejemplo, para apuntar al backend del Módulo 1 desde el frontend del Módulo 1:

- `VITE_API_URL=http://localhost:3001`

Estas variables se definen en un archivo `.env` en la carpeta del frontend correspondiente (si el proyecto lo utiliza). Si no existe tal archivo, el código suele usar valores por defecto (por ejemplo `http://localhost:3001` para el Módulo 1). Consulte el `README` o el código en `src/services/api.js` (o equivalente) de cada frontend para confirmar la URL base de la API.

---

### 4.5 Ejecución del sistema

#### Opción A: Ejecución con Docker (recomendada)

1. Tener Docker y Docker Compose instalados.
2. En la raíz del proyecto:

   ```bash
   docker-compose up --build -d
   ```

3. La primera vez se construyen las imágenes y se inicializa la base de datos (script en `database/init`). Puede tardar unos minutos.
4. Verificar que los contenedores estén en ejecución:

   ```bash
   docker-compose ps
   ```

5. Acceder a las aplicaciones según los puertos definidos en `docker-compose` (por ejemplo, frontend principal en `http://localhost:5173` si está mapeado así).

#### Opción B: Ejecución manual (sin Docker)

**Paso 1: Base de datos**

- PostgreSQL en ejecución.
- Base de datos `egresados_unt` creada.
- Script `database/init/01_init.sql` ejecutado (y opcionalmente `seed01.sql`, `seed02.sql`).

**Paso 2: Levantar los cuatro backends**

Opción compacta (una sola terminal desde la raíz):

```bash
npm run dev
```

Esto suele levantar los cuatro backends en paralelo (y a veces el frontend del Módulo 1; revisar el script `dev` en `package.json`).

O abrir **cuatro terminales** y en cada una:

```bash
# Terminal 1
cd modulo-1-registro/backend && npm run dev

# Terminal 2
cd modulo-2-bolsa/backend && npm run dev

# Terminal 3
cd modulo-3-seguimiento/backend && npm run dev

# Terminal 4
cd modulo-4-mentores/backend && npm run dev
```

**Paso 3: Levantar los frontends**

Otra opción es usar el script global (si incluye frontends):

```bash
npm run dev:all
```

O abrir terminales adicionales y ejecutar, por ejemplo:

```bash
cd modulo-1-registro/frontend && npm run dev
cd modulo-2-bolsa/frontend && npm run dev
cd modulo-3-seguimiento/frontend && npm run dev
cd modulo-4-mentores/frontend && npm run dev
```

El frontend del **Módulo 1** (puerto 5173) suele ser el punto de entrada principal desde el que se accede a todos los módulos mediante la barra de navegación.

---

## 5. Verificación del funcionamiento

1. **PostgreSQL:** comprobar que la base de datos existe y que las tablas están creadas:
   ```bash
   psql -U postgres -d egresados_unt -c "\dt egresados_unt.*"
   ```

2. **Backends:** en el navegador o con `curl`:
   - `http://localhost:3001/api/health` (y análogo 3002, 3003, 3004 si existe ruta `/api/health`).
   - Debe responder con un mensaje de estado OK.

3. **Frontend principal:** abrir `http://localhost:5173` (o el puerto configurado). Debe cargar la pantalla de login.

4. **Login:** usar las credenciales de prueba (por ejemplo usuario `admin`, contraseña `Admin2024!` si están en los seeds). Tras iniciar sesión, debe mostrarse el dashboard y la barra de navegación con enlaces a los cuatro módulos.

5. **Navegación:** comprobar que desde el menú se puede acceder a Registro y Perfil, Bolsa Laboral, Seguimiento de Empleabilidad y Red de Mentores sin errores de red (404 o CORS).

Si todo lo anterior funciona, la instalación puede considerarse correcta.

---

## 6. Problemas comunes y soluciones

| Problema | Posible causa | Solución |
|----------|----------------|----------|
| **Error de conexión a la base de datos** | PostgreSQL no está corriendo, o `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` incorrectos. | Verificar que el servicio PostgreSQL esté activo. Revisar `.env` (host, puerto, usuario, contraseña). En Docker, usar `DB_HOST=postgres`. |
| **Base de datos no existe** | No se ejecutó la creación de la BD. | Ejecutar `psql -U postgres -c "CREATE DATABASE egresados_unt;"`. |
| **Tablas no existen / errores al iniciar** | No se ejecutó el script de inicialización. | Ejecutar `psql -U postgres -d egresados_unt -f database/init/01_init.sql`. |
| **Puerto ya en uso** | Otro proceso usa 3001, 5173, etc. | Cambiar el puerto en `.env` (backend) o en el script de arranque del frontend (ej. `vite --port 5174`). Cerrar la aplicación que use ese puerto. |
| **CORS / bloqueo de peticiones** | El frontend llama desde un origen no permitido. | Ajustar `CORS_ORIGIN` en el `.env` del backend al origen del frontend (ej. `http://localhost:5173`). |
| **401 / 403 al usar la aplicación** | Token JWT expirado o inválido. | Cerrar sesión y volver a iniciar sesión. Revisar que `JWT_SECRET` sea el mismo en todos los backends que comparten sesión. |
| **npm install falla** | Versión antigua de Node/npm o red. | Usar Node.js 20+ y `npm install` con conexión estable. Probar `npm cache clean --force` y repetir. |
| **Docker: contenedor de BD no inicia** | Permisos o volumen corrupto. | Revisar logs: `docker-compose logs postgres`. Si es necesario resetear: `docker-compose down -v` y volver a `docker-compose up -d`. |
| **Frontend no conecta con el backend** | URL de API incorrecta. | Revisar `VITE_API_URL` o la baseURL en `src/services/api.js` (o equivalente) para que apunte al puerto correcto del backend. |

---

*Documento preparado para el proyecto SGE-UNT — Universidad Nacional de Trujillo.*
