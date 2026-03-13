const db = require('../config/database');
const { success, error, paginate } = require('../../../shared/utils/response');

// POST /api/mentores/registro
exports.registro = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados pueden registrarse como mentores', 403);
    const id_egresado = req.user.id_egresado;
    const { area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad, especialidades } = req.body;

    // Verificar +2 años de experiencia
    const exp = await db.query(
      `SELECT COUNT(*) FROM egresados_unt.experiencias_laborales
       WHERE id_egresado=$1 AND (actual=TRUE OR fecha_fin IS NOT NULL)
         AND fecha_inicio <= NOW() - INTERVAL '2 years'`, [id_egresado]
    );
    if (parseInt(exp.rows[0].count) === 0) {
      return error(res, 'Se requiere al menos 2 años de experiencia laboral para ser mentor', 400);
    }

    const r = await db.query(
      `INSERT INTO mentoria.mentores (id_egresado, area_expertise, empresa_actual, cargo_actual, disponibilidad_horas, modalidad)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id_egresado) DO UPDATE SET area_expertise=$2, empresa_actual=$3, cargo_actual=$4,
         disponibilidad_horas=$5, modalidad=$6, activo=TRUE
       RETURNING id_mentor`,
      [id_egresado, area_expertise, empresa_actual, cargo_actual, disponibilidad_horas || 4, modalidad || 'ambas']
    );
    const id_mentor = r.rows[0].id_mentor;

    if (especialidades?.length) {
      await db.query('DELETE FROM mentoria.mentor_especialidades WHERE id_mentor=$1', [id_mentor]);
      for (const id_habilidad of especialidades) {
        await db.query('INSERT INTO mentoria.mentor_especialidades (id_mentor,id_habilidad) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id_mentor, id_habilidad]);
      }
    }
    success(res, { id_mentor }, 'Registrado como mentor exitosamente', 201);
  } catch (e) { next(e); }
};

// GET /api/mentores
exports.getAll = async (req, res, next) => {
  try {
    const { especialidad, escuela, modalidad, page=1, limit=12 } = req.query;
    const cond = ['m.activo=TRUE'];
    const params = [];
    let idx = 1;
    if (modalidad) { cond.push(`m.modalidad=$${idx++}`); params.push(modalidad); }
    if (escuela)   { cond.push(`e.id_escuela=$${idx++}`); params.push(escuela); }
    if (especialidad) {
      cond.push(`EXISTS(SELECT 1 FROM mentoria.mentor_especialidades me WHERE me.id_mentor=m.id_mentor AND me.id_habilidad=$${idx++})`);
      params.push(especialidad);
    }
    const where = 'WHERE ' + cond.join(' AND ');
    const cnt = await db.query(
      `SELECT COUNT(*) FROM mentoria.mentores m JOIN egresados_unt.egresados e ON e.id_egresado=m.id_egresado ${where}`, params
    );
    const offset = (page-1)*limit;
    const r = await db.query(
      `SELECT m.id_mentor, m.area_expertise, m.empresa_actual, m.cargo_actual,
              m.disponibilidad_horas, m.modalidad, m.calificacion_promedio,
              per.nombres, per.apellidos, per.foto_url,
              es.nombre AS escuela,
              (SELECT COUNT(*) FROM mentoria.solicitudes_mentoria s WHERE s.id_mentor=m.id_mentor AND s.estado='aceptada') AS mentorados_activos,
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
    success(res, { ...r.rows[0], evaluaciones: evaluaciones.rows });
  } catch (e) { next(e); }
};

// GET /api/mentores/mis-solicitudes  (para el mentor)
exports.misSolicitudes = async (req, res, next) => {
  try {
    const mentor = await db.query('SELECT id_mentor FROM mentoria.mentores WHERE id_egresado=$1', [req.user.id_egresado]);
    if (!mentor.rows.length) return error(res, 'No eres mentor', 403);
    const r = await db.query(
      `SELECT s.id_solicitud, s.objetivo, s.estado, s.fecha_solicitud,
              per.nombres, per.apellidos, per.foto_url, es.nombre AS escuela
       FROM mentoria.solicitudes_mentoria s
       JOIN egresados_unt.egresados eg  ON eg.id_egresado=s.id_estudiante_egresado
       JOIN egresados_unt.personas per  ON per.id_persona=eg.id_persona
       JOIN egresados_unt.escuelas es   ON es.id_escuela=eg.id_escuela
       WHERE s.id_mentor=$1 ORDER BY s.fecha_solicitud DESC`,
      [mentor.rows[0].id_mentor]
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};
