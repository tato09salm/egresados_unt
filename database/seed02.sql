-- ============================================================
-- SEED 02: Datos de prueba adicionales (incrementales)
-- Compatible con 01_init.sql y seed01.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) Nuevas personas de prueba
-- ------------------------------------------------------------
INSERT INTO egresados_unt.personas (tipo_doc, num_doc, nombres, apellidos, email, telefono, direccion)
VALUES
('DNI','66666666','Rosa','Mendoza Ríos','rosa.mendoza@test.com','987666666','Trujillo - La Libertad'),
('DNI','77777777','Jorge','Núñez Díaz','jorge.nunez@test.com','987777777','Trujillo - La Libertad'),
('DNI','88888888','Elena','Quispe León','elena.quispe@test.com','987888888','Chepén - La Libertad'),
('DNI','99999999','Diego','Cruz Herrera','diego.cruz@test.com','987999999','Pacasmayo - La Libertad'),
('DNI','10101010','María','Flores Campos','maria.flores@test.com','987101010','Ascope - La Libertad')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 2) Nuevos egresados vinculados a las personas creadas
-- ------------------------------------------------------------
INSERT INTO egresados_unt.egresados
(id_persona, codigo_universitario, id_escuela, promocion, anio_ingreso, anio_egreso, anio_titulacion, promedio, situacion_laboral)
SELECT
  p.id_persona,
  'EGR2-' || RIGHT(p.num_doc, 4),
  CASE
    WHEN p.email LIKE 'rosa.%'  THEN 'b1000000-0000-0000-0000-000000000001' -- Informática
    WHEN p.email LIKE 'jorge.%' THEN 'b1000000-0000-0000-0000-000000000002' -- Industrial
    WHEN p.email LIKE 'elena.%' THEN 'b1000000-0000-0000-0000-000000000004' -- Administración
    WHEN p.email LIKE 'diego.%' THEN 'b1000000-0000-0000-0000-000000000005' -- Economía
    ELSE                           'b1000000-0000-0000-0000-000000000006' -- Matemáticas
  END::uuid,
  '2021-II',
  2017,
  2022,
  2023,
  14 + random()*5,
  CASE WHEN random() > 0.5 THEN 'empleado' ELSE 'desempleado' END
FROM egresados_unt.personas p
WHERE p.email IN (
  'rosa.mendoza@test.com','jorge.nunez@test.com','elena.quispe@test.com','diego.cruz@test.com','maria.flores@test.com'
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 3) Usuarios para los nuevos egresados
--    Password sugerido para pruebas: Egresado2024!
-- ------------------------------------------------------------
INSERT INTO egresados_unt.usuarios (id_persona, username, password_hash, rol)
SELECT
  p.id_persona,
  split_part(p.email, '@', 1),
  crypt('Egresado2024!', gen_salt('bf', 10)),
  'egresado'
FROM egresados_unt.personas p
WHERE p.email IN (
  'rosa.mendoza@test.com','jorge.nunez@test.com','elena.quispe@test.com','diego.cruz@test.com','maria.flores@test.com'
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 4) Perfiles profesionales para nuevos egresados
-- ------------------------------------------------------------
INSERT INTO egresados_unt.perfiles_profesionales
(id_egresado, resumen, linkedin_url, github_url, portfolio_url, disponibilidad, modalidad_trabajo, pretension_salarial)
SELECT
  e.id_egresado,
  'Perfil profesional de prueba para escenarios de matching laboral.',
  'https://linkedin.com/in/' || split_part(p.email, '@', 1),
  'https://github.com/' || split_part(p.email, '@', 1),
  'https://portfolio.test/' || split_part(p.email, '@', 1),
  'abierto_ofertas',
  CASE
    WHEN p.email LIKE 'rosa.%'  THEN 'hibrido'
    WHEN p.email LIKE 'jorge.%' THEN 'presencial'
    WHEN p.email LIKE 'elena.%' THEN 'remoto'
    WHEN p.email LIKE 'diego.%' THEN 'presencial'
    ELSE 'cualquiera'
  END,
  CASE
    WHEN p.email LIKE 'rosa.%'  THEN 3500
    WHEN p.email LIKE 'jorge.%' THEN 3000
    WHEN p.email LIKE 'elena.%' THEN 2800
    WHEN p.email LIKE 'diego.%' THEN 2600
    ELSE 2400
  END
FROM egresados_unt.egresados e
JOIN egresados_unt.personas p ON p.id_persona = e.id_persona
WHERE p.email IN (
  'rosa.mendoza@test.com','jorge.nunez@test.com','elena.quispe@test.com','diego.cruz@test.com','maria.flores@test.com'
)
  AND e.id_egresado NOT IN (SELECT id_egresado FROM egresados_unt.perfiles_profesionales)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 5) Educación continua adicional
-- ------------------------------------------------------------
INSERT INTO egresados_unt.educacion_continua
(id_egresado, tipo, nombre, institucion, fecha_inicio, fecha_fin, url_certificado)
SELECT e.id_egresado, 'certificacion', 'Scrum Fundamentals', 'Scrum Study', '2023-02-01', '2023-04-15', 'https://cert.test/scrum'
FROM egresados_unt.egresados e
JOIN egresados_unt.personas p ON p.id_persona = e.id_persona
WHERE p.email = 'rosa.mendoza@test.com'
ON CONFLICT DO NOTHING;

INSERT INTO egresados_unt.educacion_continua
(id_egresado, tipo, nombre, institucion, fecha_inicio, fecha_fin, url_certificado)
SELECT e.id_egresado, 'diplomado', 'Analítica de Datos para Negocios', 'UNT - Educación Continua', '2023-05-01', '2023-11-30', 'https://cert.test/analytics'
FROM egresados_unt.egresados e
JOIN egresados_unt.personas p ON p.id_persona = e.id_persona
WHERE p.email = 'elena.quispe@test.com'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 6) Habilidades para nuevos egresados (4 por perfil)
-- ------------------------------------------------------------
INSERT INTO egresados_unt.egresado_habilidades (id_egresado, id_habilidad, nivel)
SELECT
  e.id_egresado,
  h.id_habilidad,
  CASE
    WHEN random() < 0.30 THEN 'basico'
    WHEN random() < 0.75 THEN 'intermedio'
    ELSE 'avanzado'
  END
FROM egresados_unt.egresados e
JOIN egresados_unt.personas p ON p.id_persona = e.id_persona
CROSS JOIN LATERAL (
  SELECT id_habilidad
  FROM egresados_unt.habilidades
  ORDER BY random()
  LIMIT 4
) h
WHERE p.email IN (
  'rosa.mendoza@test.com','jorge.nunez@test.com','elena.quispe@test.com','diego.cruz@test.com','maria.flores@test.com'
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 7) Contactos de empresa adicionales
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.contactos_empresa (id_empresa, nombre, cargo, email, telefono, principal)
VALUES
('e1000000-0000-0000-0000-000000000001', 'Lucía Torres', 'Analista RRHH', 'lucia.torres@techsol.com', '044-123456', FALSE),
('e1000000-0000-0000-0000-000000000002', 'Marco Rojas', 'Coordinador Selección', 'marco.rojas@indtrujillo.com', '044-654321', TRUE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 8) Usuario adicional para la segunda empresa
--    Password sugerido para pruebas: Empresa2024!
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.usuarios_empresa (id_empresa, email, password_hash, nombre, cargo)
VALUES
('e1000000-0000-0000-0000-000000000002', 'talento@indtrujillo.com', crypt('Empresa2024!', gen_salt('bf', 10)), 'Talento Humano', 'Jefatura')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 9) Nuevas ofertas laborales
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.ofertas_laborales
(id_empresa, titulo, descripcion, requisitos, beneficios, salario_min, salario_max, modalidad, tipo_contrato, estado, vacantes)
VALUES
(
  'e1000000-0000-0000-0000-000000000001',
  'Backend Developer Node.js',
  'Desarrollo y mantenimiento de APIs REST para soluciones educativas.',
  'Node.js, PostgreSQL, Git, Docker',
  'Trabajo híbrido, seguro privado, capacitaciones',
  3000, 4500, 'hibrido', 'indefinido', 'activa', 2
),
(
  'e1000000-0000-0000-0000-000000000002',
  'Analista de Planeamiento Industrial',
  'Optimización de procesos y mejora continua de indicadores de planta.',
  'Ingeniería Industrial, Excel Avanzado, SAP',
  'Bonos trimestrales, movilidad, línea de carrera',
  2600, 3900, 'presencial', 'plazo_fijo', 'activa', 1
),
(
  'e1000000-0000-0000-0000-000000000001',
  'Data Analyst Junior',
  'Análisis descriptivo y visualización de datos para áreas de negocio.',
  'SQL, Python, Power BI',
  'Trabajo remoto, horario flexible',
  2200, 3200, 'remoto', 'plazo_fijo', 'activa', 2
)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 10) Habilidades requeridas por oferta (incluye seed inicial)
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('React', 'Node.js', 'PostgreSQL')
WHERE o.titulo = 'Desarrollador Full Stack React/Node.js'
ON CONFLICT DO NOTHING;

INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('Python', 'Power BI', 'Data Analysis')
WHERE o.titulo = 'Analista de Datos'
ON CONFLICT DO NOTHING;

INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('Excel Avanzado', 'SAP', 'Gestión de proyectos')
WHERE o.titulo = 'Ingeniero Industrial'
ON CONFLICT DO NOTHING;

INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('Node.js', 'PostgreSQL', 'Docker')
WHERE o.titulo = 'Backend Developer Node.js'
ON CONFLICT DO NOTHING;

INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('Excel Avanzado', 'SAP', 'Gestión de proyectos')
WHERE o.titulo = 'Analista de Planeamiento Industrial'
ON CONFLICT DO NOTHING;

INSERT INTO bolsa_laboral.oferta_habilidades (id_oferta, id_habilidad, requerida)
SELECT o.id_oferta, h.id_habilidad, TRUE
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.habilidades h ON h.nombre IN ('SQL', 'Python', 'Power BI')
WHERE o.titulo = 'Data Analyst Junior'
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 11) Postulaciones adicionales con estados mixtos
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.postulaciones
(id_oferta, id_egresado, estado, carta_presentacion, puntaje_match, notas_empresa)
SELECT
  o.id_oferta,
  e.id_egresado,
  CASE
    WHEN random() < 0.25 THEN 'revision'
    WHEN random() < 0.45 THEN 'entrevista'
    WHEN random() < 0.60 THEN 'aceptado'
    WHEN random() < 0.75 THEN 'rechazado'
    ELSE 'pendiente'
  END,
  'Carta de presentación de prueba para proceso de selección.',
  ROUND((65 + random()*30)::numeric, 2),
  'Registro generado por seed02'
FROM bolsa_laboral.ofertas_laborales o
JOIN egresados_unt.egresados e ON TRUE
WHERE o.estado = 'activa'
ORDER BY o.fecha_publicacion DESC, random()
LIMIT 20
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 12) Entrevistas para postulaciones en estado entrevista
-- ------------------------------------------------------------
INSERT INTO bolsa_laboral.entrevistas (id_postulacion, fecha_hora, modalidad, enlace_virtual, notas, resultado)
SELECT
  p.id_postulacion,
  NOW() + ((ROW_NUMBER() OVER ())::text || ' days')::interval,
  CASE WHEN random() < 0.5 THEN 'virtual' ELSE 'telefonica' END,
  'https://meet.google.com/seed02-' || LEFT(p.id_postulacion::text, 8),
  'Entrevista programada automáticamente por seed02',
  'pendiente'
FROM bolsa_laboral.postulaciones p
LEFT JOIN bolsa_laboral.entrevistas e ON e.id_postulacion = p.id_postulacion
WHERE p.estado = 'entrevista'
  AND e.id_entrevista IS NULL
LIMIT 8
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 13) Nuevos mentores y especialidades
-- ------------------------------------------------------------
INSERT INTO mentoria.mentores (id_egresado, area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad, activo)
SELECT
  e.id_egresado,
  'Arquitectura de Software',
  'Consultora Digital Norte',
  'Tech Lead',
  6,
  'ambas',
  TRUE
FROM egresados_unt.egresados e
LEFT JOIN mentoria.mentores m ON m.id_egresado = e.id_egresado
WHERE m.id_mentor IS NULL
ORDER BY random()
LIMIT 3
ON CONFLICT DO NOTHING;

INSERT INTO mentoria.mentor_especialidades (id_mentor, id_habilidad)
SELECT m.id_mentor, h.id_habilidad
FROM mentoria.mentores m
CROSS JOIN LATERAL (
  SELECT id_habilidad
  FROM egresados_unt.habilidades
  ORDER BY random()
  LIMIT 2
) h
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 14) Solicitudes de mentoría con distintos estados
-- ------------------------------------------------------------
INSERT INTO mentoria.solicitudes_mentoria
(id_estudiante_egresado, id_mentor, objetivo, estado, fecha_respuesta)
SELECT
  e.id_egresado,
  m.id_mentor,
  'Fortalecer competencias para inserción laboral y entrevistas técnicas',
  CASE
    WHEN random() < 0.45 THEN 'aceptada'
    WHEN random() < 0.70 THEN 'pendiente'
    ELSE 'rechazada'
  END,
  NOW() - INTERVAL '1 day'
FROM egresados_unt.egresados e
JOIN mentoria.mentores m ON m.id_egresado <> e.id_egresado
ORDER BY random()
LIMIT 8
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 15) Sesiones para solicitudes aceptadas
-- ------------------------------------------------------------
INSERT INTO mentoria.sesiones_mentoria
(id_solicitud, fecha_hora, duracion_min, modalidad, enlace_virtual, notas_mentor, notas_mentorado, realizada)
SELECT
  s.id_solicitud,
  NOW() + ((ROW_NUMBER() OVER())::text || ' days')::interval,
  CASE WHEN random() < 0.5 THEN 60 ELSE 90 END,
  CASE WHEN random() < 0.6 THEN 'virtual' ELSE 'presencial' END,
  'https://meet.google.com/mentoria-' || LEFT(s.id_solicitud::text, 8),
  'Sesión programada por seed02',
  'Pendiente de realización',
  FALSE
FROM mentoria.solicitudes_mentoria s
LEFT JOIN mentoria.sesiones_mentoria sm ON sm.id_solicitud = s.id_solicitud
WHERE s.estado = 'aceptada'
  AND sm.id_sesion IS NULL
LIMIT 6
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 16) Respuestas de encuesta adicionales (3 y 5 años)
-- ------------------------------------------------------------
INSERT INTO egresados_unt.respuestas_encuesta (id_encuesta, id_egresado, completada)
SELECT 'f1000000-0000-0000-0000-000000000002', e.id_egresado, TRUE
FROM egresados_unt.egresados e
ORDER BY random()
LIMIT 5
ON CONFLICT DO NOTHING;

INSERT INTO egresados_unt.respuestas_encuesta (id_encuesta, id_egresado, completada)
SELECT 'f1000000-0000-0000-0000-000000000003', e.id_egresado, TRUE
FROM egresados_unt.egresados e
ORDER BY random()
LIMIT 5
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- 17) Detalle de respuestas para las nuevas encuestas
-- ------------------------------------------------------------
INSERT INTO egresados_unt.detalle_respuestas (id_respuesta, id_pregunta, valor_texto, valor_numero)
SELECT
  r.id_respuesta,
  p.id_pregunta,
  'Detalle semilla seed02',
  CASE WHEN p.tipo_respuesta = 'numero' THEN ROUND((1 + random()*12)::numeric, 2) ELSE NULL END
FROM egresados_unt.respuestas_encuesta r
JOIN egresados_unt.preguntas_encuesta p ON p.id_encuesta = r.id_encuesta
LEFT JOIN egresados_unt.detalle_respuestas d
  ON d.id_respuesta = r.id_respuesta AND d.id_pregunta = p.id_pregunta
WHERE r.id_encuesta IN ('f1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000003')
  AND d.id_detalle IS NULL
LIMIT 30;

COMMIT;

-- Fin seed02
