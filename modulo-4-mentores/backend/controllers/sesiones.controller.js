const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

// POST /api/sesiones
exports.agendar = async (req, res, next) => {
  try {
    const { id_solicitud, fecha_hora, duracion_min, modalidad, enlace_virtual } = req.body;
    if (!id_solicitud || !fecha_hora) return error(res, 'id_solicitud y fecha_hora requeridos', 400);
    const sol = await db.query("SELECT * FROM mentoria.solicitudes_mentoria WHERE id_solicitud=$1 AND estado='aceptada'", [id_solicitud]);
    if (!sol.rows.length) return error(res, 'Solicitud no encontrada o no aceptada', 404);
    const r = await db.query(
      `INSERT INTO mentoria.sesiones_mentoria (id_solicitud, fecha_hora, duracion_min, modalidad, enlace_virtual)
       VALUES ($1,$2,$3,$4,$5) RETURNING id_sesion`,
      [id_solicitud, fecha_hora, duracion_min || 60, modalidad || 'virtual', enlace_virtual || null]
    );
    success(res, { id_sesion: r.rows[0].id_sesion }, 'Sesión agendada', 201);
  } catch (e) { next(e); }
};

// GET /api/sesiones  (sesiones del usuario)
exports.getMias = async (req, res, next) => {
  try {
    const id_egresado = req.user.id_egresado;
    const r = await db.query(
      `SELECT se.id_sesion, se.fecha_hora, se.duracion_min, se.modalidad, se.enlace_virtual, se.realizada,
              so.id_solicitud, so.objetivo,
              per_m.nombres AS mentor_nombre, per_m.apellidos AS mentor_apellido,
              per_s.nombres AS mentorado_nombre, per_s.apellidos AS mentorado_apellido
       FROM mentoria.sesiones_mentoria se
       JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
       JOIN mentoria.mentores m ON m.id_mentor=so.id_mentor
       JOIN egresados_unt.egresados eg_m  ON eg_m.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per_m  ON per_m.id_persona=eg_m.id_persona
       JOIN egresados_unt.egresados eg_s  ON eg_s.id_egresado=so.id_estudiante_egresado
       JOIN egresados_unt.personas per_s  ON per_s.id_persona=eg_s.id_persona
       WHERE so.id_estudiante_egresado=$1 OR m.id_egresado=$1
       ORDER BY se.fecha_hora DESC`,
      [id_egresado]
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// PUT /api/sesiones/:id/completar
exports.completar = async (req, res, next) => {
  try {
    const { notas_mentor, notas_mentorado } = req.body;
    const se = await db.query('SELECT * FROM mentoria.sesiones_mentoria WHERE id_sesion=$1', [req.params.id]);
    if (!se.rows.length) return error(res, 'Sesión no encontrada', 404);
    await db.query(
      'UPDATE mentoria.sesiones_mentoria SET realizada=TRUE, notas_mentor=$1, notas_mentorado=$2 WHERE id_sesion=$3',
      [notas_mentor || null, notas_mentorado || null, req.params.id]
    );
    success(res, null, 'Sesión marcada como realizada');
  } catch (e) { next(e); }
};

// POST /api/sesiones/:id/evaluar
exports.evaluar = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados pueden evaluar', 403);
    const { calificacion, comentario } = req.body;
    if (!calificacion || calificacion < 1 || calificacion > 5) return error(res, 'Calificación debe ser entre 1 y 5', 400);

    const se = await db.query('SELECT * FROM mentoria.sesiones_mentoria WHERE id_sesion=$1 AND realizada=TRUE', [req.params.id]);
    if (!se.rows.length) return error(res, 'Sesión no encontrada o no realizada', 404);

    const dup = await db.query('SELECT id_eval FROM mentoria.evaluaciones_mentor WHERE id_sesion=$1 AND id_evaluador=$2', [req.params.id, req.user.id_egresado]);
    if (dup.rows.length) return error(res, 'Ya evaluaste esta sesión', 409);

    await db.query(
      'INSERT INTO mentoria.evaluaciones_mentor (id_sesion, id_evaluador, calificacion, comentario) VALUES ($1,$2,$3,$4)',
      [req.params.id, req.user.id_egresado, calificacion, comentario || null]
    );

    // Actualizar promedio del mentor
    const sol = await db.query(
      'SELECT so.id_mentor FROM mentoria.sesiones_mentoria se JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud WHERE se.id_sesion=$1',
      [req.params.id]
    );
    if (sol.rows.length) {
      await db.query(
        `UPDATE mentoria.mentores SET calificacion_promedio=(
           SELECT ROUND(AVG(ev.calificacion)::numeric,2)
           FROM mentoria.evaluaciones_mentor ev
           JOIN mentoria.sesiones_mentoria se ON se.id_sesion=ev.id_sesion
           JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
           WHERE so.id_mentor=$1
         ) WHERE id_mentor=$1`,
        [sol.rows[0].id_mentor]
      );
    }
    success(res, null, 'Evaluación registrada', 201);
  } catch (e) { next(e); }
};
