-- ============================================================
-- SGE-UNT: Sistema de Gestión de Egresados
-- Universidad Nacional de Trujillo
-- Script SQL Completo - PostgreSQL 16
-- ============================================================

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ESQUEMAS
-- ============================================================
CREATE SCHEMA IF NOT EXISTS egresados_unt;
CREATE SCHEMA IF NOT EXISTS auditoria;
CREATE SCHEMA IF NOT EXISTS bolsa_laboral;
CREATE SCHEMA IF NOT EXISTS mentoria;

-- ============================================================
-- FUNCIÓN TRIGGER para updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MÓDULO 1: REGISTRO Y PERFIL DE EGRESADOS
-- ============================================================

CREATE TABLE IF NOT EXISTS egresados_unt.facultades (
  id_facultad   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo        VARCHAR(10)  NOT NULL UNIQUE,
  nombre        VARCHAR(200) NOT NULL,
  decano        VARCHAR(200),
  email         VARCHAR(100),
  estado        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.escuelas (
  id_escuela    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_facultad   UUID NOT NULL REFERENCES egresados_unt.facultades(id_facultad),
  codigo        VARCHAR(10)  NOT NULL UNIQUE,
  nombre        VARCHAR(200) NOT NULL,
  director      VARCHAR(200),
  estado        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.personas (
  id_persona    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo_doc      VARCHAR(10)  NOT NULL DEFAULT 'DNI'
                  CHECK (tipo_doc IN ('DNI','CARNET_EXT','PASAPORTE')),
  num_doc       VARCHAR(20)  NOT NULL,
  nombres       VARCHAR(100) NOT NULL,
  apellidos     VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  telefono      VARCHAR(20),
  direccion     TEXT,
  ubigeo        VARCHAR(10),
  foto_url      TEXT,
  estado        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tipo_doc, num_doc)
);

CREATE TABLE IF NOT EXISTS egresados_unt.egresados (
  id_egresado          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_persona           UUID NOT NULL UNIQUE REFERENCES egresados_unt.personas(id_persona),
  codigo_universitario VARCHAR(20)  NOT NULL UNIQUE,
  id_escuela           UUID NOT NULL REFERENCES egresados_unt.escuelas(id_escuela),
  promocion            VARCHAR(20),
  anio_ingreso         SMALLINT CHECK (anio_ingreso >= 1900 AND anio_ingreso <= 2100),
  anio_egreso          SMALLINT CHECK (anio_egreso  >= 1900 AND anio_egreso  <= 2100),
  anio_titulacion      SMALLINT CHECK (anio_titulacion >= 1900 AND anio_titulacion <= 2100),
  promedio             DECIMAL(4,2) CHECK (promedio >= 0 AND promedio <= 20),
  situacion_laboral    VARCHAR(30) DEFAULT 'no_especificado'
                         CHECK (situacion_laboral IN ('empleado','desempleado','independiente','estudiante','no_especificado')),
  activo               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.perfiles_profesionales (
  id_perfil              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_egresado            UUID NOT NULL UNIQUE REFERENCES egresados_unt.egresados(id_egresado),
  resumen                TEXT,
  linkedin_url           TEXT,
  github_url             TEXT,
  portfolio_url          TEXT,
  disponibilidad         VARCHAR(20) DEFAULT 'disponible'
                           CHECK (disponibilidad IN ('disponible','no_disponible','abierto_ofertas')),
  modalidad_trabajo      VARCHAR(20)
                           CHECK (modalidad_trabajo IN ('presencial','remoto','hibrido','cualquiera')),
  pretension_salarial    DECIMAL(10,2) CHECK (pretension_salarial >= 0),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.habilidades (
  id_habilidad  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(100) NOT NULL UNIQUE,
  categoria     VARCHAR(50)
                  CHECK (categoria IN ('tecnica','blanda','idioma','herramienta','otro')),
  estado        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.egresado_habilidades (
  id_egresado   UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado) ON DELETE CASCADE,
  id_habilidad  UUID NOT NULL REFERENCES egresados_unt.habilidades(id_habilidad),
  nivel         VARCHAR(20) NOT NULL DEFAULT 'intermedio'
                  CHECK (nivel IN ('basico','intermedio','avanzado','experto')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_egresado, id_habilidad)
);

CREATE TABLE IF NOT EXISTS egresados_unt.experiencias_laborales (
  id_exp        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_egresado   UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado) ON DELETE CASCADE,
  empresa       VARCHAR(200) NOT NULL,
  cargo         VARCHAR(200) NOT NULL,
  fecha_inicio  DATE NOT NULL,
  fecha_fin     DATE,
  descripcion   TEXT,
  actual        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.educacion_continua (
  id_edu           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_egresado      UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado) ON DELETE CASCADE,
  tipo             VARCHAR(30) NOT NULL DEFAULT 'curso'
                     CHECK (tipo IN ('maestria','doctorado','diplomado','certificacion','curso','otro')),
  nombre           VARCHAR(200) NOT NULL,
  institucion      VARCHAR(200) NOT NULL,
  fecha_inicio     DATE,
  fecha_fin        DATE,
  url_certificado  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.usuarios (
  id_usuario    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_persona    UUID NOT NULL UNIQUE REFERENCES egresados_unt.personas(id_persona),
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol           VARCHAR(20) NOT NULL DEFAULT 'egresado'
                  CHECK (rol IN ('admin','egresado','empresa','docente')),
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 2: BOLSA LABORAL
-- ============================================================

CREATE TABLE IF NOT EXISTS bolsa_laboral.empresas (
  id_empresa       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ruc              VARCHAR(11) NOT NULL UNIQUE,
  razon_social     VARCHAR(200) NOT NULL,
  nombre_comercial VARCHAR(200),
  sector           VARCHAR(100),
  tamano           VARCHAR(20) DEFAULT 'mediana'
                     CHECK (tamano IN ('microempresa','pequena','mediana','grande')),
  sitio_web        TEXT,
  logo_url         TEXT,
  verificada       BOOLEAN NOT NULL DEFAULT FALSE,
  estado           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bolsa_laboral.contactos_empresa (
  id_contacto   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empresa    UUID NOT NULL REFERENCES bolsa_laboral.empresas(id_empresa) ON DELETE CASCADE,
  nombre        VARCHAR(200) NOT NULL,
  cargo         VARCHAR(200),
  email         VARCHAR(150) NOT NULL,
  telefono      VARCHAR(20),
  principal     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bolsa_laboral.ofertas_laborales (
  id_oferta         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empresa        UUID NOT NULL REFERENCES bolsa_laboral.empresas(id_empresa),
  titulo            VARCHAR(200) NOT NULL,
  descripcion       TEXT NOT NULL,
  requisitos        TEXT,
  beneficios        TEXT,
  salario_min       DECIMAL(10,2) CHECK (salario_min >= 0),
  salario_max       DECIMAL(10,2) CHECK (salario_max >= 0),
  modalidad         VARCHAR(20) NOT NULL DEFAULT 'presencial'
                      CHECK (modalidad IN ('presencial','remoto','hibrido')),
  tipo_contrato     VARCHAR(30) NOT NULL DEFAULT 'indefinido'
                      CHECK (tipo_contrato IN ('indefinido','plazo_fijo','practicas','services')),
  fecha_publicacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cierre      TIMESTAMPTZ,
  estado            VARCHAR(20) NOT NULL DEFAULT 'activa'
                      CHECK (estado IN ('activa','cerrada','pausada','borrador')),
  vacantes          INTEGER NOT NULL DEFAULT 1 CHECK (vacantes > 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bolsa_laboral.oferta_habilidades (
  id_oferta     UUID NOT NULL REFERENCES bolsa_laboral.ofertas_laborales(id_oferta) ON DELETE CASCADE,
  id_habilidad  UUID NOT NULL REFERENCES egresados_unt.habilidades(id_habilidad),
  requerida     BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_oferta, id_habilidad)
);

CREATE TABLE IF NOT EXISTS bolsa_laboral.postulaciones (
  id_postulacion     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_oferta          UUID NOT NULL REFERENCES bolsa_laboral.ofertas_laborales(id_oferta),
  id_egresado        UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado),
  fecha_postulacion  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado             VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','revision','entrevista','aceptado','rechazado')),
  carta_presentacion TEXT,
  puntaje_match      DECIMAL(5,2) CHECK (puntaje_match >= 0 AND puntaje_match <= 100),
  notas_empresa      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_oferta, id_egresado)
);

CREATE TABLE IF NOT EXISTS bolsa_laboral.entrevistas (
  id_entrevista    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_postulacion   UUID NOT NULL REFERENCES bolsa_laboral.postulaciones(id_postulacion),
  fecha_hora       TIMESTAMPTZ NOT NULL,
  modalidad        VARCHAR(20) NOT NULL DEFAULT 'virtual'
                     CHECK (modalidad IN ('presencial','virtual','telefonica')),
  enlace_virtual   TEXT,
  notas            TEXT,
  resultado        VARCHAR(20) DEFAULT 'pendiente'
                     CHECK (resultado IN ('pendiente','aprobado','rechazado')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 3: SEGUIMIENTO DE EMPLEABILIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS egresados_unt.encuestas (
  id_encuesta   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  tipo          VARCHAR(20) NOT NULL DEFAULT '1_anio'
                  CHECK (tipo IN ('1_anio','3_anios','5_anios','especial')),
  activa        BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_inicio  DATE,
  fecha_fin     DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.preguntas_encuesta (
  id_pregunta     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_encuesta     UUID NOT NULL REFERENCES egresados_unt.encuestas(id_encuesta) ON DELETE CASCADE,
  orden           SMALLINT NOT NULL DEFAULT 1,
  texto           TEXT NOT NULL,
  tipo_respuesta  VARCHAR(20) NOT NULL DEFAULT 'texto'
                    CHECK (tipo_respuesta IN ('texto','numero','opcion_multiple','verdadero_falso','escala')),
  opciones        JSONB,
  requerida       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.respuestas_encuesta (
  id_respuesta     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_encuesta      UUID NOT NULL REFERENCES egresados_unt.encuestas(id_encuesta),
  id_egresado      UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado),
  fecha_respuesta  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completada       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id_encuesta, id_egresado)
);

CREATE TABLE IF NOT EXISTS egresados_unt.detalle_respuestas (
  id_detalle       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_respuesta     UUID NOT NULL REFERENCES egresados_unt.respuestas_encuesta(id_respuesta) ON DELETE CASCADE,
  id_pregunta      UUID NOT NULL REFERENCES egresados_unt.preguntas_encuesta(id_pregunta),
  valor_texto      TEXT,
  valor_numero     DECIMAL(10,2),
  valor_opciones   JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS egresados_unt.indicadores_empleabilidad (
  id_indicador              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_escuela                UUID NOT NULL REFERENCES egresados_unt.escuelas(id_escuela),
  anio                      SMALLINT NOT NULL,
  mes                       SMALLINT CHECK (mes >= 1 AND mes <= 12),
  tasa_empleabilidad        DECIMAL(5,2) CHECK (tasa_empleabilidad >= 0 AND tasa_empleabilidad <= 100),
  tiempo_promedio_empleo    DECIMAL(6,2),
  salario_promedio          DECIMAL(10,2),
  sector_predominante       VARCHAR(100),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MÓDULO 4: RED DE MENTORES
-- ============================================================

CREATE TABLE IF NOT EXISTS mentoria.mentores (
  id_mentor               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_egresado             UUID NOT NULL UNIQUE REFERENCES egresados_unt.egresados(id_egresado),
  area_expertise          VARCHAR(200),
  empresa_actual          VARCHAR(200),
  cargo_actual            VARCHAR(200),
  disponibilidad_horas    INTEGER DEFAULT 4 CHECK (disponibilidad_horas >= 0),
  modalidad               VARCHAR(20) NOT NULL DEFAULT 'ambas'
                            CHECK (modalidad IN ('presencial','virtual','ambas')),
  activo                  BOOLEAN NOT NULL DEFAULT TRUE,
  calificacion_promedio   DECIMAL(3,2) DEFAULT 0 CHECK (calificacion_promedio >= 0 AND calificacion_promedio <= 5),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentoria.mentor_especialidades (
  id_mentor     UUID NOT NULL REFERENCES mentoria.mentores(id_mentor) ON DELETE CASCADE,
  id_habilidad  UUID NOT NULL REFERENCES egresados_unt.habilidades(id_habilidad),
  PRIMARY KEY (id_mentor, id_habilidad)
);

CREATE TABLE IF NOT EXISTS mentoria.solicitudes_mentoria (
  id_solicitud            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_estudiante_egresado  UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado),
  id_mentor               UUID NOT NULL REFERENCES mentoria.mentores(id_mentor),
  objetivo                TEXT NOT NULL,
  estado                  VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                            CHECK (estado IN ('pendiente','aceptada','rechazada','expirada','completada')),
  fecha_solicitud         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_respuesta         TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentoria.sesiones_mentoria (
  id_sesion        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_solicitud     UUID NOT NULL REFERENCES mentoria.solicitudes_mentoria(id_solicitud),
  fecha_hora       TIMESTAMPTZ NOT NULL,
  duracion_min     INTEGER DEFAULT 60 CHECK (duracion_min > 0),
  modalidad        VARCHAR(20) NOT NULL DEFAULT 'virtual'
                     CHECK (modalidad IN ('presencial','virtual')),
  enlace_virtual   TEXT,
  notas_mentor     TEXT,
  notas_mentorado  TEXT,
  realizada        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentoria.evaluaciones_mentor (
  id_eval       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_sesion     UUID NOT NULL REFERENCES mentoria.sesiones_mentoria(id_sesion),
  id_evaluador  UUID NOT NULL REFERENCES egresados_unt.egresados(id_egresado),
  calificacion  INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario    TEXT,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA DE USUARIOS EMPRESA (para login de empresas)
-- ============================================================
CREATE TABLE IF NOT EXISTS bolsa_laboral.usuarios_empresa (
  id_usuario_emp  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empresa      UUID NOT NULL REFERENCES bolsa_laboral.empresas(id_empresa),
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  nombre          VARCHAR(200),
  cargo           VARCHAR(200),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_login    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
DO $$ DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT schemaname, tablename FROM pg_tables
    WHERE schemaname IN ('egresados_unt','bolsa_laboral','mentoria')
      AND tablename NOT IN ('egresado_habilidades','oferta_habilidades','mentor_especialidades','detalle_respuestas','evaluaciones_mentor')
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_updated_at ON %I.%I;
       CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I.%I
       FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();',
      t.schemaname, t.tablename,
      t.schemaname, t.tablename
    );
  END LOOP;
END $$;

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_personas_email        ON egresados_unt.personas(email);
CREATE INDEX IF NOT EXISTS idx_personas_num_doc      ON egresados_unt.personas(num_doc);
CREATE INDEX IF NOT EXISTS idx_egresados_escuela     ON egresados_unt.egresados(id_escuela);
CREATE INDEX IF NOT EXISTS idx_egresados_codigo      ON egresados_unt.egresados(codigo_universitario);
CREATE INDEX IF NOT EXISTS idx_egresados_anio        ON egresados_unt.egresados(anio_egreso);
CREATE INDEX IF NOT EXISTS idx_exp_egresado          ON egresados_unt.experiencias_laborales(id_egresado);
CREATE INDEX IF NOT EXISTS idx_edu_egresado          ON egresados_unt.educacion_continua(id_egresado);
CREATE INDEX IF NOT EXISTS idx_usuarios_username     ON egresados_unt.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_ofertas_empresa       ON bolsa_laboral.ofertas_laborales(id_empresa);
CREATE INDEX IF NOT EXISTS idx_ofertas_estado        ON bolsa_laboral.ofertas_laborales(estado);
CREATE INDEX IF NOT EXISTS idx_ofertas_fecha         ON bolsa_laboral.ofertas_laborales(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_postulaciones_oferta  ON bolsa_laboral.postulaciones(id_oferta);
CREATE INDEX IF NOT EXISTS idx_postulaciones_egre    ON bolsa_laboral.postulaciones(id_egresado);
CREATE INDEX IF NOT EXISTS idx_mentores_activo       ON mentoria.mentores(activo);
CREATE INDEX IF NOT EXISTS idx_solicitudes_mentor    ON mentoria.solicitudes_mentoria(id_mentor);
CREATE INDEX IF NOT EXISTS idx_solicitudes_egre      ON mentoria.solicitudes_mentoria(id_estudiante_egresado);
CREATE INDEX IF NOT EXISTS idx_sesiones_solicitud    ON mentoria.sesiones_mentoria(id_solicitud);
CREATE INDEX IF NOT EXISTS idx_escuelas_facultad     ON egresados_unt.escuelas(id_facultad);
CREATE INDEX IF NOT EXISTS idx_empresas_ruc          ON bolsa_laboral.empresas(ruc);

-- ============================================================
-- SEEDS: Datos semilla
-- ============================================================

-- Facultades
INSERT INTO egresados_unt.facultades (id_facultad, codigo, nombre, decano, email) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'FING', 'Facultad de Ingeniería', 'Dr. Carlos Rodríguez Paz', 'fing@unitru.edu.pe'),
  ('a1000000-0000-0000-0000-000000000002', 'FCEE', 'Facultad de Ciencias Económicas', 'Dra. María González Vega', 'fcee@unitru.edu.pe'),
  ('a1000000-0000-0000-0000-000000000003', 'FCCM', 'Facultad de Ciencias Físicas y Matemáticas', 'Dr. Jorge Pérez Torres', 'fccm@unitru.edu.pe'),
  ('a1000000-0000-0000-0000-000000000004', 'FMED', 'Facultad de Medicina', 'Dr. Luis Sánchez Reyes', 'fmed@unitru.edu.pe')
ON CONFLICT DO NOTHING;

-- Escuelas
INSERT INTO egresados_unt.escuelas (id_escuela, id_facultad, codigo, nombre, director) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'EINF', 'Ingeniería Informática', 'Mg. Ana Flores Díaz'),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'EIND', 'Ingeniería Industrial', 'Mg. Pedro Castillo Ruiz'),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'ECIV', 'Ingeniería Civil', 'Mg. Roberto Vega Mora'),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'EADM', 'Administración', 'Mg. Carmen López Suárez'),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'ECON', 'Economía', 'Mg. Ricardo Herrera Alba'),
  ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'EMAT', 'Matemáticas', 'Mg. Sofia Ramírez Cruz'),
  ('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000004', 'EMED', 'Medicina Humana', 'Dr. Marco Gómez León')
ON CONFLICT DO NOTHING;

-- Habilidades base
INSERT INTO egresados_unt.habilidades (nombre, categoria) VALUES
  ('JavaScript',        'tecnica'),
  ('Python',            'tecnica'),
  ('Java',              'tecnica'),
  ('C++',               'tecnica'),
  ('React',             'tecnica'),
  ('Node.js',           'tecnica'),
  ('PostgreSQL',        'tecnica'),
  ('MySQL',             'tecnica'),
  ('MongoDB',           'tecnica'),
  ('Docker',            'tecnica'),
  ('Git',               'herramienta'),
  ('Figma',             'herramienta'),
  ('Excel Avanzado',    'herramienta'),
  ('Power BI',          'herramienta'),
  ('AutoCAD',           'herramienta'),
  ('SAP',               'herramienta'),
  ('Inglés',            'idioma'),
  ('Portugués',         'idioma'),
  ('Liderazgo',         'blanda'),
  ('Trabajo en equipo', 'blanda'),
  ('Comunicación',      'blanda'),
  ('Resolución de problemas', 'blanda'),
  ('Gestión de proyectos', 'blanda'),
  ('Machine Learning',  'tecnica'),
  ('Data Analysis',     'tecnica'),
  ('AWS',               'tecnica'),
  ('Azure',             'tecnica'),
  ('Spring Boot',       'tecnica'),
  ('Django',            'tecnica'),
  ('Vue.js',            'tecnica')
ON CONFLICT (nombre) DO NOTHING;

-- Usuario administrador por defecto
-- Persona admin
INSERT INTO egresados_unt.personas (id_persona, tipo_doc, num_doc, nombres, apellidos, email) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'DNI', '00000001', 'Administrador', 'SGE-UNT', 'admin@sge.unitru.edu.pe')
ON CONFLICT DO NOTHING;

-- Egresado de prueba (para admin)
INSERT INTO egresados_unt.egresados (id_egresado, id_persona, codigo_universitario, id_escuela, anio_ingreso, anio_egreso, anio_titulacion) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ADMIN-001', 'b1000000-0000-0000-0000-000000000001', 2010, 2015, 2016)
ON CONFLICT DO NOTHING;

-- Usuario admin (password: Admin2024!)
INSERT INTO egresados_unt.usuarios (id_persona, username, password_hash, rol) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'admin', crypt('Admin2024!', gen_salt('bf', 10)), 'admin')
ON CONFLICT DO NOTHING;

-- Empresa de prueba
INSERT INTO bolsa_laboral.empresas (id_empresa, ruc, razon_social, nombre_comercial, sector, tamano, verificada) VALUES
  ('e1000000-0000-0000-0000-000000000001', '20123456789', 'Tech Solutions SAC', 'TechSol', 'Tecnología', 'mediana', TRUE),
  ('e1000000-0000-0000-0000-000000000002', '20987654321', 'Industrias Trujillo SA', 'IndTrujillo', 'Manufactura', 'grande', TRUE)
ON CONFLICT DO NOTHING;

-- Usuario de empresa (password: Empresa2024!)
INSERT INTO bolsa_laboral.usuarios_empresa (id_empresa, email, password_hash, nombre, cargo) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'rrhh@techsol.com', crypt('Empresa2024!', gen_salt('bf', 10)), 'Recursos Humanos', 'Jefe de RRHH')
ON CONFLICT DO NOTHING;

-- Ofertas laborales de prueba
INSERT INTO bolsa_laboral.ofertas_laborales (id_empresa, titulo, descripcion, requisitos, salario_min, salario_max, modalidad, tipo_contrato, vacantes) VALUES
  ('e1000000-0000-0000-0000-000000000001',
   'Desarrollador Full Stack React/Node.js',
   'Buscamos desarrollador con experiencia en React y Node.js para unirse a nuestro equipo de desarrollo.',
   'Mínimo 1 año de experiencia, conocimientos en React, Node.js, PostgreSQL',
   2500, 4000, 'hibrido', 'indefinido', 2),
  ('e1000000-0000-0000-0000-000000000001',
   'Analista de Datos',
   'Posición para análisis de datos empresariales con Power BI y Python.',
   'Experiencia en Python, Power BI, SQL',
   2000, 3500, 'remoto', 'plazo_fijo', 1),
  ('e1000000-0000-0000-0000-000000000002',
   'Ingeniero Industrial',
   'Gestión y optimización de procesos de producción.',
   'Título en Ingeniería Industrial, conocimiento de SAP',
   2200, 3800, 'presencial', 'indefinido', 1)
ON CONFLICT DO NOTHING;

-- Encuestas por defecto
INSERT INTO egresados_unt.encuestas (id_encuesta, nombre, descripcion, tipo, activa) VALUES
  ('f1000000-0000-0000-0000-000000000001',
   'Encuesta de Seguimiento 1 Año',
   'Encuesta de empleabilidad para egresados con 1 año de titulados',
   '1_anio', TRUE),
  ('f1000000-0000-0000-0000-000000000002',
   'Encuesta de Seguimiento 3 Años',
   'Encuesta de empleabilidad para egresados con 3 años de titulados',
   '3_anios', TRUE),
  ('f1000000-0000-0000-0000-000000000003',
   'Encuesta de Seguimiento 5 Años',
   'Encuesta de empleabilidad para egresados con 5 años de titulados',
   '5_anios', TRUE)
ON CONFLICT DO NOTHING;

-- Preguntas de encuestas
INSERT INTO egresados_unt.preguntas_encuesta (id_encuesta, orden, texto, tipo_respuesta, opciones, requerida) VALUES
  ('f1000000-0000-0000-0000-000000000001', 1, '¿Actualmente se encuentra trabajando?', 'opcion_multiple',
   '["Sí, en relación a mi carrera", "Sí, pero no en mi área", "No, estoy buscando trabajo", "No, estoy estudiando"]', TRUE),
  ('f1000000-0000-0000-0000-000000000001', 2, '¿Cuánto tiempo tardó en conseguir su primer empleo (en meses)?', 'numero', NULL, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 3, '¿Cuál es su salario mensual aproximado (en soles)?', 'numero', NULL, FALSE),
  ('f1000000-0000-0000-0000-000000000001', 4, '¿En qué sector trabaja?', 'opcion_multiple',
   '["Público", "Privado", "Independiente/Freelance", "ONG", "No aplica"]', FALSE),
  ('f1000000-0000-0000-0000-000000000001', 5, '¿La formación recibida en la UNT fue útil para su trabajo actual?', 'escala', NULL, FALSE)
ON CONFLICT DO NOTHING;

-- Indicadores de empleabilidad de prueba
INSERT INTO egresados_unt.indicadores_empleabilidad (id_escuela, anio, mes, tasa_empleabilidad, tiempo_promedio_empleo, salario_promedio, sector_predominante) VALUES
  ('b1000000-0000-0000-0000-000000000001', 2023, 1, 82.5, 4.2, 3200.00, 'Tecnología'),
  ('b1000000-0000-0000-0000-000000000001', 2023, 6, 85.0, 3.8, 3450.00, 'Tecnología'),
  ('b1000000-0000-0000-0000-000000000001', 2024, 1, 88.3, 3.5, 3700.00, 'Tecnología'),
  ('b1000000-0000-0000-0000-000000000002', 2023, 1, 75.0, 5.1, 2800.00, 'Manufactura'),
  ('b1000000-0000-0000-0000-000000000002', 2024, 1, 78.5, 4.8, 3000.00, 'Manufactura'),
  ('b1000000-0000-0000-0000-000000000004', 2023, 1, 70.0, 6.0, 2500.00, 'Servicios'),
  ('b1000000-0000-0000-0000-000000000004', 2024, 1, 73.2, 5.5, 2700.00, 'Servicios')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SCHEMA AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria.logs (
  id_log       BIGSERIAL PRIMARY KEY,
  tabla        VARCHAR(100) NOT NULL,
  operacion    VARCHAR(10)  NOT NULL CHECK (operacion IN ('INSERT','UPDATE','DELETE')),
  id_registro  UUID,
  datos_ant    JSONB,
  datos_nuevo  JSONB,
  usuario_db   VARCHAR(100) DEFAULT CURRENT_USER,
  ip_origen    VARCHAR(50),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BITÁCORA DE ACCESOS (login/logout y módulo visitado)
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria.accesos (
  id_acceso      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Usuario tipo sistema (egresados_unt.usuarios)
  id_usuario     UUID,
  id_persona     UUID,
  -- Usuario tipo empresa (bolsa_laboral.usuarios_empresa)
  id_usuario_emp UUID,
  id_empresa     UUID,

  username       VARCHAR(150) NOT NULL,
  nombres        VARCHAR(200),
  rol            VARCHAR(20)  NOT NULL,

  ingreso_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  salida_at      TIMESTAMPTZ,
  modulo_actual  VARCHAR(50) NOT NULL DEFAULT 'inicio',

  ip_origen      VARCHAR(50),
  user_agent     TEXT
);

CREATE INDEX IF NOT EXISTS idx_accesos_ingreso_at ON auditoria.accesos(ingreso_at DESC);
CREATE INDEX IF NOT EXISTS idx_accesos_rol        ON auditoria.accesos(rol);
CREATE INDEX IF NOT EXISTS idx_accesos_username   ON auditoria.accesos(username);

--\echo 'SGE-UNT: Base de datos inicializada correctamente'
