# SGE-UNT — Sistema de Gestión de Egresados
**Universidad Nacional de Trujillo** | PostgreSQL 16 + Node.js/Express + React

---

## 🚀 Inicio Rápido con Docker (Recomendado)

```bash
# 1. Clonar / descomprimir el proyecto
cd sge-unt

# 2. Levantar todo el sistema con Docker Compose
docker-compose up --build -d

# 3. Verificar que los servicios estén corriendo
docker-compose ps
```

El primer arranque tarda ~2-3 minutos mientras se construyen las imágenes y se inicializa la BD.

### URLs de acceso Docker
| Módulo | Frontend | Backend API |
|--------|----------|-------------|
| Registro y Perfil | http://localhost:5173 | http://localhost:3001 |
| Bolsa Laboral | http://localhost:5174 | http://localhost:3002 |
| Seguimiento | http://localhost:5175 | http://localhost:3003 |
| Red de Mentores | http://localhost:5176 | http://localhost:3004 |

---

## 🔧 Inicio Manual (sin Docker)

### Requisitos
- Node.js 20+
- PostgreSQL 16
- npm

### 1. Configurar la Base de Datos

```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE egresados_unt;"

# Ejecutar el script SQL completo
psql -U postgres -d egresados_unt -f database/init/01_init.sql
```

### 2. Iniciar los Backends

Abrir 4 terminales:

### Inicializacion compact

Abre una única terminal y ejecuta los siguientes comandos. Esto instalará automáticamente todas las dependencias en cada módulo (backend y frontend) y luego iniciará todos los servicios en paralelo.

```bash
# 1. Instalar dependencias en la raíz y en todos los módulos
npm install && npm run install:all

# 2. Levantar todos los servicios
npm run dev
```

```bash
# Terminal 1 — Módulo 1: Registro (puerto 3001)
cd modulo-1-registro/backend
cp .env.example .env
npm install
npm run dev

# Terminal 2 — Módulo 2: Bolsa Laboral (puerto 3002)
cd modulo-2-bolsa/backend
cp .env.example .env
npm install
npm run dev

# Terminal 3 — Módulo 3: Seguimiento (puerto 3003)
cd modulo-3-seguimiento/backend
cp .env.example .env
npm install
npm run dev

# Terminal 4 — Módulo 4: Mentores (puerto 3004)
cd modulo-4-mentores/backend
cp .env.example .env
npm install
npm run dev
```

### 3. Iniciar los Frontends

Abrir 4 terminales adicionales:

```bash
# Terminal 5 — Frontend Módulo 1 (puerto 5173)
cd modulo-1-registro/frontend && npm install && npm run dev

# Terminal 6 — Frontend Módulo 2 (puerto 5174)
cd modulo-2-bolsa/frontend && npm install && npm run dev

# Terminal 7 — Frontend Módulo 3 (puerto 5175)
cd modulo-3-seguimiento/frontend && npm install && npm run dev

# Terminal 8 — Frontend Módulo 4 (puerto 5176)
cd modulo-4-mentores/frontend && npm install && npm run dev
```

---

## 👤 Credenciales de Acceso

| Tipo | Usuario | Contraseña | Módulo |
|------|---------|-----------|--------|
| Administrador | `admin` | `Admin2024!` | Todos |
| Empresa | `rrhh@techsol.com` | `Empresa2024!` | Bolsa Laboral |
| Empresa | `talento@indtrujillo.com` | `Empresa2024!` | Bolsa Laboral |
| Egresado | `rosa.mendoza` | `Egresado2024!` | Registro / Bolsa |
| Egresado | `jorge.nunez` | `Egresado2024!` | Registro / Bolsa |
| Egresado | `elena.quispe` | `Egresado2024!` | Registro / Bolsa |
| Egresado | `diego.cruz` | `Egresado2024!` | Registro / Bolsa |
| Egresado | `maria.flores` | `Egresado2024!` | Registro / Bolsa |

---

## 🏗️ Arquitectura

```
sge-unt/
├── docker-compose.yml          # Orquestación de todos los servicios
├── database/
│   └── init/01_init.sql        # Script SQL completo (BD + seeds)
├── shared/                     # Código compartido por todos los módulos
│   ├── config/db.js
│   ├── middleware/auth.js
│   └── utils/response.js
├── modulo-1-registro/          # Puerto 3001/5173 — Registro y Perfil
│   ├── backend/
│   └── frontend/
├── modulo-2-bolsa/             # Puerto 3002/5174 — Bolsa Laboral
│   ├── backend/
│   └── frontend/
├── modulo-3-seguimiento/       # Puerto 3003/5175 — Seguimiento
│   ├── backend/
│   └── frontend/
└── modulo-4-mentores/          # Puerto 3004/5176 — Red de Mentores
    ├── backend/
    └── frontend/
```

---

## 📋 Módulos del Sistema

### Módulo 1 — Registro y Perfil de Egresados
- Registro en 3 pasos: datos personales → académicos → acceso
- Gestión de perfil: habilidades, experiencia laboral, educación continua
- Autenticación JWT con roles: admin, egresado, empresa, docente

### Módulo 2 — Bolsa Laboral Inteligente
- Publicación y gestión de ofertas laborales
- Algoritmo de matching por habilidades (0–100%)
- Postulación con carta de presentación
- Dashboard Kanban para empresas

### Módulo 3 — Seguimiento de Empleabilidad
- Encuestas automáticas (1, 3, 5 años post-titulación)
- Dashboard de KPIs: tasa empleo, salario promedio, tiempo de colocación
- Gráficas de tendencias por escuela y facultad
- Reportes descargables

### Módulo 4 — Red de Mentores
- Directorio de mentores con filtros
- Solicitud y gestión de mentoría
- Agenda de sesiones
- Sistema de evaluación con estrellas

---

## 🔌 API Endpoints principales

### Módulo 1 (puerto 3001)
```
POST /api/auth/register       — Registrar egresado
POST /api/auth/login          — Iniciar sesión
GET  /api/egresados/:id       — Perfil completo
PUT  /api/egresados/:id       — Actualizar datos
GET  /api/egresados/buscar    — Búsqueda con filtros
PUT  /api/perfil/:id          — Actualizar perfil profesional
POST /api/perfil/:id/habilidades
POST /api/perfil/:id/experiencia
POST /api/perfil/:id/educacion
```

### Módulo 2 (puerto 3002)
```
GET  /api/ofertas             — Listar ofertas activas
POST /api/ofertas             — Crear oferta (empresa)
GET  /api/ofertas/:id         — Detalle de oferta
POST /api/ofertas/:id/postular — Postular
GET  /api/postulaciones/mis-postulaciones
GET  /api/postulaciones/oferta/:id
PUT  /api/postulaciones/:id/estado
GET  /api/match/recomendaciones
```

### Módulo 3 (puerto 3003)
```
GET  /api/encuestas/pendientes
GET  /api/encuestas/:id
POST /api/encuestas/:id/responder
GET  /api/dashboard/tendencias
GET  /api/dashboard/facultad/:id
GET  /api/dashboard/escuela/:id
GET  /api/reportes/empleabilidad
```

### Módulo 4 (puerto 3004)
```
POST /api/mentores/registro
GET  /api/mentores            — Directorio
GET  /api/mentores/:id        — Perfil mentor
POST /api/mentoria/solicitar
PUT  /api/mentoria/:id/responder
POST /api/sesiones            — Agendar sesión
PUT  /api/sesiones/:id/completar
POST /api/sesiones/:id/evaluar
```

---

## 🐳 Gestión Docker

```bash
# Ver logs de un servicio
docker-compose logs -f modulo1-backend

# Reiniciar un servicio
docker-compose restart modulo1-backend

# Detener todo
docker-compose down

# Detener y borrar volúmenes (resetear BD)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose up --build -d modulo1-backend
```

---

## 🗄️ Variables de Entorno

Cada backend usa las siguientes variables (configuradas en `.env`):

```env
DB_HOST=localhost        # 'postgres' en Docker
DB_PORT=5432
DB_NAME=egresados_unt
DB_USER=postgres
DB_PASSWORD=sa
JWT_SECRET=sge_unt_secret_key_2024
JWT_EXPIRES_IN=24h
PORT=3001               # 3001, 3002, 3003, 3004 según módulo
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```
