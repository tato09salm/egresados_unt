const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');
const path = require('path');
const fs = require('fs');

// POST /api/mentores/registro
exports.registro = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados pueden registrarse como mentores', 403);
    const id_egresado = req.user.id_egresado;
    const { area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad, especialidades, bio } = req.body;

    // Verificar +2 años de experiencia laboral
    const exp = await db.query(
      `SELECT COUNT(*) FROM egresados_unt.experiencias_laborales
       WHERE id_egresado=$1 AND (actual=TRUE OR fecha_fin IS NOT NULL)
         AND fecha_inicio <= NOW() - INTERVAL '2 years'`, [id_egresado]
    );
    if (parseInt(exp.rows[0].count) === 0) {
      return error(res, 'Se requiere al menos 2 años de experiencia laboral para ser mentor', 400);
    }

    // Manejar foto si se subió
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/mentores/${req.file.filename}`;
      // Actualizar foto en personas
      await db.query(
        'UPDATE egresados_unt.personas SET foto_url=$1 WHERE id_persona=(SELECT id_persona FROM egresados_unt.egresados WHERE id_egresado=$2)',
        [foto_url, id_egresado]
      );
    }

    const r = await db.query(
      `INSERT INTO mentoria.mentores (id_egresado, area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad, bio)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (id_egresado) DO UPDATE SET area_expertise=$2, empresa_actual=$3, cargo_actual=$4,
         disponibilidad_horas=$5, modalidad=$6, bio=$7, activo=TRUE
       RETURNING id_mentor`,
      [id_egresado, area_expertise, empresa_actual, cargo_actual, disponibilidad_horas || 4, modalidad || 'ambas', bio || null]
    );
    const id_mentor = r.rows[0].id_mentor;

    if (especialidades?.length) {
      const espArr = Array.isArray(especialidades) ? especialidades : JSON.parse(especialidades);
      await db.query('DELETE FROM mentoria.mentor_especialidades WHERE id_mentor=$1', [id_mentor]);
      for (const id_habilidad of espArr) {
        await db.query('INSERT INTO mentoria.mentor_especialidades (id_mentor,id_habilidad) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id_mentor, id_habilidad]);
      }
    }
    success(res, { id_mentor }, 'Registrado como mentor exitosamente', 201);
  } catch (e) { next(e); }
};

// PUT /api/mentores/perfil — Editar datos del mentor
exports.editarPerfil = async (req, res, next) => {
  try {
    const id_egresado = req.user.id_egresado;
    const { area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad, bio, telefono, email, especialidades } = req.body;

    const mentor = await db.query('SELECT id_mentor FROM mentoria.mentores WHERE id_egresado=$1', [id_egresado]);
    if (!mentor.rows.length) return error(res, 'No eres mentor', 403);

    // Manejar foto
    if (req.file) {
      const foto_url = `/uploads/mentores/${req.file.filename}`;
      await db.query(
        'UPDATE egresados_unt.personas SET foto_url=$1 WHERE id_persona=(SELECT id_persona FROM egresados_unt.egresados WHERE id_egresado=$2)',
        [foto_url, id_egresado]
      );
    }

    // Actualizar datos de contacto en personas
    if (telefono || email) {
      const setParts = [];
      const params = [];
      let idx = 1;
      if (telefono) { setParts.push(`telefono=$${idx++}`); params.push(telefono); }
      if (email)    { setParts.push(`email=$${idx++}`); params.push(email); }
      params.push(id_egresado);
      if (setParts.length) {
        await db.query(
          `UPDATE egresados_unt.personas SET ${setParts.join(',')} WHERE id_persona=(SELECT id_persona FROM egresados_unt.egresados WHERE id_egresado=$${idx})`,
          params
        );
      }
    }

    // Actualizar datos del mentor
    await db.query(
      `UPDATE mentoria.mentores SET area_expertise=COALESCE($1,area_expertise), empresa_actual=COALESCE($2,empresa_actual),
       cargo_actual=COALESCE($3,cargo_actual), disponibilidad_horas=COALESCE($4,disponibilidad_horas),
       modalidad=COALESCE($5,modalidad), bio=COALESCE($6,bio)
       WHERE id_egresado=$7`,
      [area_expertise||null, empresa_actual||null, cargo_actual||null, disponibilidad_horas||null, modalidad||null, bio||null, id_egresado]
    );

    if (especialidades) {
      const espArr = Array.isArray(especialidades) ? especialidades : JSON.parse(especialidades);
      const id_mentor = mentor.rows[0].id_mentor;
      await db.query('DELETE FROM mentoria.mentor_especialidades WHERE id_mentor=$1', [id_mentor]);
      for (const id_habilidad of espArr) {
        await db.query('INSERT INTO mentoria.mentor_especialidades (id_mentor,id_habilidad) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id_mentor, id_habilidad]);
      }
    }

    success(res, null, 'Perfil actualizado exitosamente');
  } catch (e) { next(e); }
};

// GET /api/mentores
exports.getAll = async (req, res, next) => {
  try {
    const { especialidad, escuela, modalidad, disponibilidad, nombre, page=1, limit=12 } = req.query;
    const cond = ['m.activo=TRUE'];
    const params = [];
    let idx = 1;
    if (modalidad)      { cond.push(`m.modalidad=$${idx++}`); params.push(modalidad); }
    if (escuela)        { cond.push(`e.id_escuela=$${idx++}`); params.push(escuela); }
    if (disponibilidad) { cond.push(`m.disponibilidad_horas>=$${idx++}`); params.push(disponibilidad); }
    if (especialidad) {
      cond.push(`EXISTS(SELECT 1 FROM mentoria.mentor_especialidades me WHERE me.id_mentor=m.id_mentor AND me.id_habilidad=$${idx++})`);
      params.push(especialidad);
    }
    if (nombre) {
      cond.push(`(LOWER(per.nombres) LIKE LOWER($${idx}) OR LOWER(per.apellidos) LIKE LOWER($${idx}) OR LOWER(CONCAT(per.nombres,' ',per.apellidos)) LIKE LOWER($${idx}))`);
      params.push(`%${nombre}%`); idx++;
    }
    const where = 'WHERE ' + cond.join(' AND ');
    const cnt = await db.query(
      `SELECT COUNT(*) FROM mentoria.mentores m
       JOIN egresados_unt.egresados e ON e.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per ON per.id_persona=e.id_persona
       ${where}`, params
    );
    const offset = (page-1)*limit;
    const r = await db.query(
      `SELECT m.id_mentor, m.area_expertise, m.empresa_actual, m.cargo_actual,
              m.disponibilidad_horas, m.modalidad, m.calificacion_promedio,
              per.nombres, per.apellidos, per.foto_url,
              es.nombre AS escuela,
              (SELECT COUNT(*) FROM mentoria.solicitudes_mentoria s WHERE s.id_mentor=m.id_mentor AND s.estado='aceptada') AS mentorados_activos,
              (SELECT COUNT(*) FROM mentoria.sesiones_mentoria se JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud WHERE so.id_mentor=m.id_mentor AND se.realizada=TRUE) AS total_sesiones,
              ARRAY(SELECT h.nombre FROM mentoria.mentor_especialidades me JOIN egresados_unt.habilidades h ON h.id_habilidad=me.id_habilidad WHERE me.id_mentor=m.id_mentor) AS especialidades
       FROM mentoria.mentores m
       JOIN egresados_unt.egresados e   ON e.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per  ON per.id_persona=e.id_persona
       JOIN egresados_unt.escuelas es   ON es.id_escuela=e.id_escuela
       ${where} ORDER BY m.calificacion_promedio DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    success(res, r.rows, 'Mentores obtenidos', 200, paginate(page, limit, parseInt(cnt.rows[0].count)));
  } catch (e) { next(e); }
};

// GET /api/mentores/:id
exports.getById = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT m.*, per.nombres, per.apellidos, per.email, per.foto_url, per.telefono,
              es.nombre AS escuela, f.nombre AS facultad,
              ARRAY(SELECT h.nombre FROM mentoria.mentor_especialidades me JOIN egresados_unt.habilidades h ON h.id_habilidad=me.id_habilidad WHERE me.id_mentor=m.id_mentor) AS especialidades
       FROM mentoria.mentores m
       JOIN egresados_unt.egresados e   ON e.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per  ON per.id_persona=e.id_persona
       JOIN egresados_unt.escuelas es   ON es.id_escuela=e.id_escuela
       JOIN egresados_unt.facultades f  ON f.id_facultad=es.id_facultad
       WHERE m.id_mentor=$1`, [req.params.id]
    );
    if (!r.rows.length) return error(res, 'Mentor no encontrado', 404);

    const evaluaciones = await db.query(
      `SELECT ev.calificacion, ev.comentario, ev.fecha, per.nombres, per.apellidos
       FROM mentoria.evaluaciones_mentor ev
       JOIN egresados_unt.egresados eg ON eg.id_egresado=ev.id_evaluador
       JOIN egresados_unt.personas per ON per.id_persona=eg.id_persona
       JOIN mentoria.sesiones_mentoria se ON se.id_sesion=ev.id_sesion
       JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
       WHERE so.id_mentor=$1 ORDER BY ev.fecha DESC LIMIT 10`, [req.params.id]
    );

    // Estadísticas del mentor
    const stats = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1 AND estado='aceptada') AS mentorados_activos,
         (SELECT COUNT(*) FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1) AS total_solicitudes,
         (SELECT COUNT(*) FROM mentoria.sesiones_mentoria se JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud WHERE so.id_mentor=$1 AND se.realizada=TRUE) AS sesiones_realizadas,
         (SELECT COUNT(*) FROM mentoria.evaluaciones_mentor ev JOIN mentoria.sesiones_mentoria se ON se.id_sesion=ev.id_sesion JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud WHERE so.id_mentor=$1) AS total_evaluaciones,
         (SELECT ROUND(AVG(ev.calificacion)::numeric,2) FROM mentoria.evaluaciones_mentor ev JOIN mentoria.sesiones_mentoria se ON se.id_sesion=ev.id_sesion JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud WHERE so.id_mentor=$1) AS calificacion_real,
         (SELECT ROUND((COUNT(CASE WHEN estado='aceptada' THEN 1 END)::numeric / NULLIF(COUNT(*),0)::numeric)*100, 2) FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1) AS tasa_aceptacion,
         (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (fecha_respuesta - fecha_solicitud))/3600)::numeric, 2) FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1 AND fecha_respuesta IS NOT NULL) AS tiempo_respuesta_horas`,
      [req.params.id]
    );

    success(res, { ...r.rows[0], evaluaciones: evaluaciones.rows, estadisticas: stats.rows[0] });
  } catch (e) { next(e); }
};

// GET /api/mentores/me
exports.getMe = async (req, res, next) => {
  try {
    const id_egresado = req.user.id_egresado;
    const r = await db.query(
      `SELECT m.*, per.nombres, per.apellidos, per.email, per.foto_url, per.telefono,
              es.nombre AS escuela, f.nombre AS facultad,
              ARRAY(SELECT h.nombre FROM mentoria.mentor_especialidades me JOIN egresados_unt.habilidades h ON h.id_habilidad=me.id_habilidad WHERE me.id_mentor=m.id_mentor) AS especialidades
       FROM mentoria.mentores m
       JOIN egresados_unt.egresados e   ON e.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per  ON per.id_persona=e.id_persona
       JOIN egresados_unt.escuelas es   ON es.id_escuela=e.id_escuela
       JOIN egresados_unt.facultades f  ON f.id_facultad=es.id_facultad
       WHERE m.id_egresado=$1`, [id_egresado]
    );
    success(res, r.rows[0] || null);
  } catch (e) { next(e); }
};

// GET /api/mentores/mis-solicitudes  (para el mentor)
exports.misSolicitudes = async (req, res, next) => {
  try {
    let id_mentor;
    if (req.user.rol === 'admin') {
      // El admin ve todas las solicitudes
      const r = await db.query(
        `SELECT s.id_solicitud, s.objetivo, s.estado, s.fecha_solicitud,
                per.nombres, per.apellidos, per.foto_url, es.nombre AS escuela,
                per_m.nombres AS mentor_nombres, per_m.apellidos AS mentor_apellidos
         FROM mentoria.solicitudes_mentoria s
         JOIN egresados_unt.egresados eg  ON eg.id_egresado=s.id_estudiante_egresado
         JOIN egresados_unt.personas per  ON per.id_persona=eg.id_persona
         JOIN egresados_unt.escuelas es   ON es.id_escuela=eg.id_escuela
         JOIN mentoria.mentores m ON m.id_mentor=s.id_mentor
         JOIN egresados_unt.egresados eg_m ON eg_m.id_egresado=m.id_egresado
         JOIN egresados_unt.personas per_m ON per_m.id_persona=eg_m.id_persona
         ORDER BY s.fecha_solicitud DESC`
      );
      return success(res, r.rows);
    } else {
      const mentor = await db.query('SELECT id_mentor FROM mentoria.mentores WHERE id_egresado=$1', [req.user.id_egresado]);
      if (!mentor.rows.length) return error(res, 'No eres mentor', 403);
      id_mentor = mentor.rows[0].id_mentor;
      const r = await db.query(
        `SELECT s.id_solicitud, s.objetivo, s.estado, s.fecha_solicitud,
                per.nombres, per.apellidos, per.foto_url, es.nombre AS escuela
         FROM mentoria.solicitudes_mentoria s
         JOIN egresados_unt.egresados eg  ON eg.id_egresado=s.id_estudiante_egresado
         JOIN egresados_unt.personas per  ON per.id_persona=eg.id_persona
         JOIN egresados_unt.escuelas es   ON es.id_escuela=eg.id_escuela
         WHERE s.id_mentor=$1 ORDER BY s.fecha_solicitud DESC`,
        [id_mentor]
      );
      return success(res, r.rows);
    }
  } catch (e) { next(e); }
};
