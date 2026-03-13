const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

// POST /api/mentoria/solicitar
exports.solicitar = async (req, res, next) => {
  try {
    if (req.user.rol !== 'egresado') return error(res, 'Solo egresados', 403);
    const { id_mentor, objetivo } = req.body;
    if (!id_mentor || !objetivo) return error(res, 'id_mentor y objetivo requeridos', 400);
    const id_egresado = req.user.id_egresado;

    // Verificar que el mentor no sea el mismo egresado
    const mentorData = await db.query('SELECT id_egresado FROM mentoria.mentores WHERE id_mentor=$1 AND activo=TRUE', [id_mentor]);
    if (!mentorData.rows.length) return error(res, 'Mentor no encontrado', 404);
    if (mentorData.rows[0].id_egresado === id_egresado) return error(res, 'No puedes ser tu propio mentor', 400);

    // Verificar máximo 3 mentorados activos
    const activos = await db.query(
      "SELECT COUNT(*) FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1 AND estado='aceptada'", [id_mentor]
    );
    if (parseInt(activos.rows[0].count) >= 3) return error(res, 'El mentor tiene el máximo de mentorados activos (3)', 400);

    // Verificar no tener solicitud pendiente
    const dup = await db.query(
      "SELECT id_solicitud FROM mentoria.solicitudes_mentoria WHERE id_mentor=$1 AND id_estudiante_egresado=$2 AND estado IN ('pendiente','aceptada')",
      [id_mentor, id_egresado]
    );
    if (dup.rows.length) return error(res, 'Ya tienes una solicitud activa con este mentor', 409);

    const r = await db.query(
      'INSERT INTO mentoria.solicitudes_mentoria (id_estudiante_egresado, id_mentor, objetivo) VALUES ($1,$2,$3) RETURNING id_solicitud',
      [id_egresado, id_mentor, objetivo]
    );
    success(res, { id_solicitud: r.rows[0].id_solicitud }, 'Solicitud enviada', 201);
  } catch (e) { next(e); }
};

// PUT /api/mentoria/:id/responder
exports.responder = async (req, res, next) => {
  try {
    const mentor = await db.query('SELECT id_mentor FROM mentoria.mentores WHERE id_egresado=$1', [req.user.id_egresado]);
    if (!mentor.rows.length) return error(res, 'No eres mentor', 403);

    const { estado } = req.body; // 'aceptada' o 'rechazada'
    if (!['aceptada','rechazada'].includes(estado)) return error(res, 'Estado debe ser aceptada o rechazada', 400);

    const sol = await db.query('SELECT * FROM mentoria.solicitudes_mentoria WHERE id_solicitud=$1 AND id_mentor=$2', [req.params.id, mentor.rows[0].id_mentor]);
    if (!sol.rows.length) return error(res, 'Solicitud no encontrada', 404);
    if (sol.rows[0].estado !== 'pendiente') return error(res, 'Solicitud ya procesada', 400);

    await db.query(
      'UPDATE mentoria.solicitudes_mentoria SET estado=$1, fecha_respuesta=NOW() WHERE id_solicitud=$2',
      [estado, req.params.id]
    );
    success(res, { estado }, `Solicitud ${estado}`);
  } catch (e) { next(e); }
};

// GET /api/mentorado/mi-mentor
exports.miMentor = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT s.id_solicitud, s.estado, s.objetivo, s.fecha_solicitud,
              m.id_mentor, m.area_expertise, m.empresa_actual, m.cargo_actual, m.calificacion_promedio,
              per.nombres, per.apellidos, per.foto_url, per.email
       FROM mentoria.solicitudes_mentoria s
       JOIN mentoria.mentores m ON m.id_mentor=s.id_mentor
       JOIN egresados_unt.egresados eg ON eg.id_egresado=m.id_egresado
       JOIN egresados_unt.personas per ON per.id_persona=eg.id_persona
       WHERE s.id_estudiante_egresado=$1 AND s.estado IN ('pendiente','aceptada')
       ORDER BY s.fecha_solicitud DESC LIMIT 1`,
      [req.user.id_egresado]
    );
    success(res, r.rows[0] || null);
  } catch (e) { next(e); }
};
