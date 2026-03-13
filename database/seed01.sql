-- ============================================================
-- PERSONAS DE PRUEBA
-- ============================================================

INSERT INTO egresados_unt.personas (num_doc,nombres,apellidos,email,telefono)
VALUES
('11111111','Luis','Ramirez Soto','luis.ramirez@test.com','987111111'),
('22222222','Carla','Vega Torres','carla.vega@test.com','987222222'),
('33333333','Miguel','Paredes Ruiz','miguel.paredes@test.com','987333333'),
('44444444','Andrea','Castillo Díaz','andrea.castillo@test.com','987444444'),
('55555555','Pedro','Salazar Gómez','pedro.salazar@test.com','987555555')
ON CONFLICT DO NOTHING;

-- ============================================================
-- EGRESADOS
-- ============================================================

INSERT INTO egresados_unt.egresados
(id_persona,codigo_universitario,id_escuela,anio_ingreso,anio_egreso,anio_titulacion,promedio,situacion_laboral)
SELECT
p.id_persona,
'EGR-'||ROW_NUMBER() OVER(),
'b1000000-0000-0000-0000-000000000001',
2016,2021,2022,
15 + random()*3,
'empleado'
FROM egresados_unt.personas p
WHERE p.email LIKE '%@test.com'
ON CONFLICT DO NOTHING;

-- ============================================================
-- PERFILES PROFESIONALES
-- ============================================================

INSERT INTO egresados_unt.perfiles_profesionales
(id_egresado,resumen,linkedin_url,github_url,modalidad_trabajo,pretension_salarial)
SELECT
id_egresado,
'Profesional apasionado por la tecnología y el desarrollo de software.',
'https://linkedin.com/test',
'https://github.com/test',
'remoto',
2500 + random()*2000
FROM egresados_unt.egresados
WHERE id_egresado NOT IN (
SELECT id_egresado FROM egresados_unt.perfiles_profesionales
);

-- ============================================================
-- HABILIDADES PARA EGRESADOS
-- ============================================================

INSERT INTO egresados_unt.egresado_habilidades
SELECT
e.id_egresado,
h.id_habilidad,
'intermedio'
FROM egresados_unt.egresados e
CROSS JOIN LATERAL (
SELECT id_habilidad FROM egresados_unt.habilidades
ORDER BY random()
LIMIT 3
) h
ON CONFLICT DO NOTHING;

-- ============================================================
-- EXPERIENCIAS LABORALES
-- ============================================================

INSERT INTO egresados_unt.experiencias_laborales
(id_egresado,empresa,cargo,fecha_inicio,actual,descripcion)
SELECT
id_egresado,
'Empresa Tech Peru',
'Desarrollador Backend',
'2022-01-01',
true,
'Desarrollo de APIs con Node.js y PostgreSQL'
FROM egresados_unt.egresados
ON CONFLICT DO NOTHING;

-- ============================================================
-- POSTULACIONES
-- ============================================================

INSERT INTO bolsa_laboral.postulaciones
(id_oferta,id_egresado,estado,puntaje_match)
SELECT
o.id_oferta,
e.id_egresado,
'pendiente',
70 + random()*20
FROM bolsa_laboral.ofertas_laborales o
CROSS JOIN egresados_unt.egresados e
LIMIT 5
ON CONFLICT DO NOTHING;

-- ============================================================
-- ENTREVISTAS
-- ============================================================

INSERT INTO bolsa_laboral.entrevistas
(id_postulacion,fecha_hora,modalidad,enlace_virtual)
SELECT
id_postulacion,
NOW() + interval '3 days',
'virtual',
'https://meet.google.com/test'
FROM bolsa_laboral.postulaciones
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================================
-- MENTORES
-- ============================================================

INSERT INTO mentoria.mentores
(id_egresado,area_expertise,empresa_actual,cargo_actual)
SELECT
id_egresado,
'Desarrollo de Software',
'Tech Solutions SAC',
'Senior Developer'
FROM egresados_unt.egresados
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================================
-- SOLICITUDES DE MENTORIA
-- ============================================================

INSERT INTO mentoria.solicitudes_mentoria
(id_estudiante_egresado,id_mentor,objetivo)
SELECT
e.id_egresado,
m.id_mentor,
'Mejorar habilidades en desarrollo backend'
FROM egresados_unt.egresados e
JOIN mentoria.mentores m ON true
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================================
-- SESIONES DE MENTORIA
-- ============================================================

INSERT INTO mentoria.sesiones_mentoria
(id_solicitud,fecha_hora,modalidad)
SELECT
id_solicitud,
NOW() + interval '5 days',
'virtual'
FROM mentoria.solicitudes_mentoria
LIMIT 2
ON CONFLICT DO NOTHING;

-- ============================================================
-- RESPUESTAS DE ENCUESTA
-- ============================================================

INSERT INTO egresados_unt.respuestas_encuesta
(id_encuesta,id_egresado,completada)
SELECT
'f1000000-0000-0000-0000-000000000001',
id_egresado,
true
FROM egresados_unt.egresados
LIMIT 3
ON CONFLICT DO NOTHING;

-- ============================================================
-- DETALLE RESPUESTAS
-- ============================================================

INSERT INTO egresados_unt.detalle_respuestas
(id_respuesta,id_pregunta,valor_texto)
SELECT
r.id_respuesta,
p.id_pregunta,
'Respuesta de prueba'
FROM egresados_unt.respuestas_encuesta r
JOIN egresados_unt.preguntas_encuesta p
ON p.id_encuesta = r.id_encuesta
LIMIT 10;