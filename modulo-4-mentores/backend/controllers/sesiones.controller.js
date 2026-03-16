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

// GET /api/sesiones
exports.getMias = async (req, res, next) => {
  try {
    const id_egresado = req.user.id_egresado;
    let query;
    let params = [];

    if (req.user.rol === 'admin') {
      // El admin ve todas las sesiones
      query = `SELECT se.id_sesion, se.fecha_hora, se.duracion_min, se.modalidad, se.enlace_virtual, se.realizada,
                      se.notas_mentor, se.notas_mentorado,
                      so.id_solicitud, so.objetivo, so.id_mentor,
                      per_m.nombres AS mentor_nombre, per_m.apellidos AS mentor_apellido,
                      per_s.nombres AS mentorado_nombre, per_s.apellidos AS mentorado_apellido,
                      EXISTS(SELECT 1 FROM mentoria.evaluaciones_mentor ev WHERE ev.id_sesion=se.id_sesion) AS ya_evaluada
               FROM mentoria.sesiones_mentoria se
               JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
               JOIN mentoria.mentores m ON m.id_mentor=so.id_mentor
               JOIN egresados_unt.egresados eg_m  ON eg_m.id_egresado=m.id_egresado
               JOIN egresados_unt.personas per_m  ON per_m.id_persona=eg_m.id_persona
               JOIN egresados_unt.egresados eg_s  ON eg_s.id_egresado=so.id_estudiante_egresado
               JOIN egresados_unt.personas per_s  ON per_s.id_persona=eg_s.id_persona
               ORDER BY se.fecha_hora DESC`;
    } else {
      query = `SELECT se.id_sesion, se.fecha_hora, se.duracion_min, se.modalidad, se.enlace_virtual, se.realizada,
                      se.notas_mentor, se.notas_mentorado,
                      so.id_solicitud, so.objetivo, so.id_mentor,
                      per_m.nombres AS mentor_nombre, per_m.apellidos AS mentor_apellido,
                      per_s.nombres AS mentorado_nombre, per_s.apellidos AS mentorado_apellido,
                      EXISTS(SELECT 1 FROM mentoria.evaluaciones_mentor ev WHERE ev.id_sesion=se.id_sesion AND ev.id_evaluador=$1) AS ya_evaluada
               FROM mentoria.sesiones_mentoria se
               JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
               JOIN mentoria.mentores m ON m.id_mentor=so.id_mentor
               JOIN egresados_unt.egresados eg_m  ON eg_m.id_egresado=m.id_egresado
               JOIN egresados_unt.personas per_m  ON per_m.id_persona=eg_m.id_persona
               JOIN egresados_unt.egresados eg_s  ON eg_s.id_egresado=so.id_estudiante_egresado
               JOIN egresados_unt.personas per_s  ON per_s.id_persona=eg_s.id_persona
               WHERE so.id_estudiante_egresado=$1 OR m.id_egresado=$1
               ORDER BY se.fecha_hora DESC`;
      params = [id_egresado];
    }
    const r = await db.query(query, params);
    success(res, r.rows);
  } catch (e) { next(e); }
};

// PUT /api/sesiones/:id/completar
exports.completar = async (req, res, next) => {
  try {
    const { notas_mentor, notas_mentorado } = req.body;
    const se = await db.query('SELECT * FROM mentoria.sesiones_mentoria WHERE id_sesion=$1', [req.params.id]);
    if (!se.rows.length) return error(res, 'Sesión no encontrada', 404);
    if (se.rows[0].realizada) return error(res, 'La sesión ya fue marcada como realizada', 400);
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
    const isEgresado = req.user.rol === 'egresado';
    const isAdmin = req.user.rol === 'admin';
    
    if (!isEgresado && !isAdmin) {
      return error(res, 'Solo egresados o administradores pueden evaluar', 403);
    }

    const { calificacion, comentario } = req.body;
    if (!calificacion || isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
      return error(res, 'Calificación debe ser un número entre 1 y 5', 400);
    }

    // Verificar que la sesión existe y está realizada
    const se = await db.query(
      `SELECT se.*, so.id_mentor, so.id_estudiante_egresado
       FROM mentoria.sesiones_mentoria se
       JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
       WHERE se.id_sesion=$1 AND se.realizada=TRUE`,
      [req.params.id]
    );
    if (!se.rows.length) return error(res, 'Sesión no encontrada o no marcada como realizada', 404);

    // Si es egresado, verificar que sea el mentorado de esa sesión
    if (isEgresado && se.rows[0].id_estudiante_egresado !== req.user.id_egresado) {
      return error(res, 'Solo el mentorado o un administrador puede evaluar esta sesión', 403);
    }

    // El evaluador_id será el id_egresado del mentorado, incluso si lo hace un admin
    const id_evaluador = se.rows[0].id_estudiante_egresado;

    const dup = await db.query(
      'SELECT id_eval FROM mentoria.evaluaciones_mentor WHERE id_sesion=$1 AND id_evaluador=$2',
      [req.params.id, id_evaluador]
    );
    if (dup.rows.length) return error(res, 'Esta sesión ya ha sido evaluada', 409);

    await db.query(
      'INSERT INTO mentoria.evaluaciones_mentor (id_sesion, id_evaluador, calificacion, comentario) VALUES ($1,$2,$3,$4)',
      [req.params.id, id_evaluador, parseInt(calificacion), comentario || (isAdmin ? '(Evaluado por Admin)' : null)]
    );

    // Actualizar calificacion_promedio del mentor
    await db.query(
      `UPDATE mentoria.mentores SET calificacion_promedio=(
         SELECT ROUND(AVG(ev.calificacion)::numeric,2)
         FROM mentoria.evaluaciones_mentor ev
         JOIN mentoria.sesiones_mentoria se ON se.id_sesion=ev.id_sesion
         JOIN mentoria.solicitudes_mentoria so ON so.id_solicitud=se.id_solicitud
         WHERE so.id_mentor=$1
       ) WHERE id_mentor=$1`,
      [se.rows[0].id_mentor]
    );
    success(res, null, 'Evaluación registrada exitosamente', 201);
  } catch (e) { next(e); }
};
