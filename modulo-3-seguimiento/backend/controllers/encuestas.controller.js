const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

let _hasPreguntaHabilitadaCol = null;
async function hasPreguntaHabilitadaColumn() {
  if (_hasPreguntaHabilitadaCol !== null) return _hasPreguntaHabilitadaCol;
  const r = await db.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema='egresados_unt'
       AND table_name='preguntas_encuesta'
       AND column_name='habilitada'
     LIMIT 1`
  );
  _hasPreguntaHabilitadaCol = r.rows.length > 0;
  return _hasPreguntaHabilitadaCol;
}

async function ensurePreguntaHabilitadaColumn() {
  const ok = await hasPreguntaHabilitadaColumn();
  if (ok) return;
  await db.query(`ALTER TABLE egresados_unt.preguntas_encuesta ADD COLUMN habilitada BOOLEAN NOT NULL DEFAULT TRUE`);
  _hasPreguntaHabilitadaCol = true;
}

// GET /api/encuestas/pendientes
exports.pendientes = async (req, res, next) => {
  try {
    const id_egresado = req.user.id_egresado;
    // Obtener año de titulación del egresado
    const egr = await db.query('SELECT anio_titulacion FROM egresados_unt.egresados WHERE id_egresado=$1', [id_egresado]);
    if (!egr.rows.length) return error(res, 'Egresado no encontrado', 404);
    const anio = egr.rows[0].anio_titulacion;
    const anioActual = new Date().getFullYear();
    const aniosDif = anioActual - (anio || anioActual);

    // Tipos de encuesta aplicables según años transcurridos
    const tipos = [];
    if (aniosDif >= 1) tipos.push('1_anio');
    if (aniosDif >= 3) tipos.push('3_anios');
    if (aniosDif >= 5) tipos.push('5_anios');

    if (!tipos.length) return success(res, [], 'No hay encuestas pendientes aún');

    const r = await db.query(
      `SELECT enc.id_encuesta, enc.nombre, enc.descripcion, enc.tipo,
              (SELECT COUNT(*) FROM egresados_unt.preguntas_encuesta pq WHERE pq.id_encuesta=enc.id_encuesta) AS total_preguntas,
              resp.id_respuesta, resp.completada
       FROM egresados_unt.encuestas enc
       LEFT JOIN egresados_unt.respuestas_encuesta resp
         ON resp.id_encuesta=enc.id_encuesta AND resp.id_egresado=$1
       WHERE enc.activa=TRUE AND enc.tipo = ANY($2::varchar[])
         AND (resp.id_respuesta IS NULL OR resp.completada=FALSE)
       ORDER BY enc.tipo`,
      [id_egresado, tipos]
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// GET /api/encuestas (admin)
exports.listar = async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT id_encuesta, nombre, descripcion, tipo, activa
       FROM egresados_unt.encuestas
       ORDER BY nombre`
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// GET /api/encuestas/:id - Obtener encuesta con preguntas
exports.getById = async (req, res, next) => {
  try {
    const enc = await db.query('SELECT * FROM egresados_unt.encuestas WHERE id_encuesta=$1', [req.params.id]);
    if (!enc.rows.length) return error(res, 'Encuesta no encontrada', 404);
    const hasCol = await hasPreguntaHabilitadaColumn();
    const isAdmin = req.user.rol === 'admin';
    const forcePublic = String(req.query.public || '') === '1';
    const where = hasCol && (!isAdmin || forcePublic) ? 'AND habilitada=TRUE' : '';
    const pregs = await db.query(
      `SELECT * FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 ${where} ORDER BY orden`,
      [req.params.id]
    );
    success(res, { ...enc.rows[0], preguntas: pregs.rows });
  } catch (e) { next(e); }
};

// GET /api/encuestas/:id/preguntas (admin)
exports.getPreguntasAdmin = async (req, res, next) => {
  try {
    await ensurePreguntaHabilitadaColumn();
    const r = await db.query(
      `SELECT * FROM egresados_unt.preguntas_encuesta
       WHERE id_encuesta=$1
       ORDER BY orden`,
      [req.params.id]
    );
    success(res, r.rows);
  } catch (e) { next(e); }
};

// POST /api/encuestas/:id/preguntas (admin)
exports.crearPregunta = async (req, res, next) => {
  try {
    await ensurePreguntaHabilitadaColumn();
    const { texto, tipo_respuesta = 'texto', opciones, requerida = true, orden } = req.body || {};
    if (!texto) return error(res, 'texto requerido', 400);
    const valid = ['texto','numero','escala','opcion_multiple','verdadero_falso'];
    if (!valid.includes(tipo_respuesta)) return error(res, 'tipo_respuesta inválido', 400);
    let ord = orden;
    if (!ord) {
      const mx = await db.query('SELECT COALESCE(MAX(orden),0)+1 AS next FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1', [req.params.id]);
      ord = mx.rows[0].next;
    }
    const r = await db.query(
      `INSERT INTO egresados_unt.preguntas_encuesta (id_encuesta, orden, texto, tipo_respuesta, opciones, requerida, habilitada)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)
       RETURNING *`,
      [req.params.id, ord, texto, tipo_respuesta, opciones ? JSON.stringify(opciones) : null, requerida !== false]
    );
    success(res, r.rows[0], 'Pregunta creada', 201);
  } catch (e) { next(e); }
};

// PUT /api/encuestas/preguntas/:id_pregunta (admin)
exports.actualizarPregunta = async (req, res, next) => {
  try {
    await ensurePreguntaHabilitadaColumn();
    const { id_pregunta } = req.params;
    const { texto, tipo_respuesta, opciones, requerida, orden, habilitada } = req.body || {};
    const valid = ['texto','numero','escala','opcion_multiple','verdadero_falso'];
    if (tipo_respuesta && !valid.includes(tipo_respuesta)) return error(res, 'tipo_respuesta inválido', 400);
    const r = await db.query(
      `UPDATE egresados_unt.preguntas_encuesta SET
         texto=COALESCE($1,texto),
         tipo_respuesta=COALESCE($2,tipo_respuesta),
         opciones=COALESCE($3,opciones),
         requerida=COALESCE($4,requerida),
         orden=COALESCE($5,orden),
         habilitada=COALESCE($6,habilitada)
       WHERE id_pregunta=$7
       RETURNING *`,
      [
        texto ?? null,
        tipo_respuesta ?? null,
        opciones === undefined ? null : (opciones ? JSON.stringify(opciones) : null),
        requerida === undefined ? null : !!requerida,
        orden ?? null,
        habilitada === undefined ? null : !!habilitada,
        id_pregunta,
      ]
    );
    if (!r.rows.length) return error(res, 'Pregunta no encontrada', 404);
    success(res, r.rows[0], 'Pregunta actualizada');
  } catch (e) { next(e); }
};

// PATCH /api/encuestas/preguntas/:id_pregunta/habilitada (admin)
exports.togglePregunta = async (req, res, next) => {
  try {
    await ensurePreguntaHabilitadaColumn();
    const { id_pregunta } = req.params;
    const { habilitada } = req.body || {};
    const r = await db.query(
      `UPDATE egresados_unt.preguntas_encuesta
       SET habilitada=COALESCE($1, NOT habilitada)
       WHERE id_pregunta=$2
       RETURNING *`,
      [habilitada === undefined ? null : !!habilitada, id_pregunta]
    );
    if (!r.rows.length) return error(res, 'Pregunta no encontrada', 404);
    success(res, r.rows[0], 'Pregunta actualizada');
  } catch (e) { next(e); }
};

// DELETE /api/encuestas/preguntas/:id_pregunta (admin)
exports.eliminarPregunta = async (req, res, next) => {
  try {
    const { id_pregunta } = req.params;
    const r = await db.query('DELETE FROM egresados_unt.preguntas_encuesta WHERE id_pregunta=$1 RETURNING id_pregunta', [id_pregunta]);
    if (!r.rows.length) return error(res, 'Pregunta no encontrada', 404);
    success(res, { id_pregunta }, 'Pregunta eliminada');
  } catch (e) { next(e); }
};

// POST /api/encuestas/:id/responder
exports.responder = async (req, res, next) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { respuestas } = req.body; // [{id_pregunta, valor_texto, valor_numero, valor_opciones}]
    const id_egresado = req.user.id_egresado;
    if (!respuestas?.length) return error(res, 'Se requieren respuestas', 400);

    // Crear o recuperar respuesta_encuesta
    let resp = await client.query(
      'SELECT id_respuesta FROM egresados_unt.respuestas_encuesta WHERE id_encuesta=$1 AND id_egresado=$2',
      [id, id_egresado]
    );
    let id_respuesta;
    if (!resp.rows.length) {
      const r = await client.query(
        'INSERT INTO egresados_unt.respuestas_encuesta (id_encuesta, id_egresado) VALUES ($1,$2) RETURNING id_respuesta',
        [id, id_egresado]
      );
      id_respuesta = r.rows[0].id_respuesta;
    } else {
      id_respuesta = resp.rows[0].id_respuesta;
    }

    // Insertar detalles
    for (const r of respuestas) {
      await client.query(
        `INSERT INTO egresados_unt.detalle_respuestas (id_respuesta, id_pregunta, valor_texto, valor_numero, valor_opciones)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id_respuesta, id_pregunta) DO UPDATE SET valor_texto=$3, valor_numero=$4, valor_opciones=$5`,
        [id_respuesta, r.id_pregunta, r.valor_texto || null, r.valor_numero || null, r.valor_opciones ? JSON.stringify(r.valor_opciones) : null]
      );
    }

    // Marcar como completada
    const hasCol = await hasPreguntaHabilitadaColumn();
    const totalSql = hasCol
      ? 'SELECT COUNT(*) FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 AND requerida=TRUE AND habilitada=TRUE'
      : 'SELECT COUNT(*) FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 AND requerida=TRUE';
    const total = await client.query(totalSql, [id]);
    const respondidas = await client.query(
      `SELECT COUNT(*) FROM egresados_unt.detalle_respuestas dr
       JOIN egresados_unt.preguntas_encuesta pq ON pq.id_pregunta=dr.id_pregunta
       WHERE dr.id_respuesta=$1 AND pq.requerida=TRUE ${hasCol ? 'AND pq.habilitada=TRUE' : ''}`, [id_respuesta]
    );
    const completada = parseInt(respondidas.rows[0].count) >= parseInt(total.rows[0].count);
    await client.query('UPDATE egresados_unt.respuestas_encuesta SET completada=$1, fecha_respuesta=NOW() WHERE id_respuesta=$2', [completada, id_respuesta]);

    await client.query('COMMIT');
    success(res, { id_respuesta, completada }, completada ? 'Encuesta completada' : 'Respuestas guardadas', 201);
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally { client.release(); }
};

// GET /api/encuestas/:id/resultados (admin)
exports.resultados = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Solo admins', 403);
    const pregs = await db.query('SELECT * FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 ORDER BY orden', [req.params.id]);
    const resultados = await Promise.all(pregs.rows.map(async p => {
      let agg;
      if (p.tipo_respuesta === 'numero' || p.tipo_respuesta === 'escala') {
        agg = await db.query(
          `SELECT AVG(dr.valor_numero) AS promedio, MIN(dr.valor_numero) AS minimo, MAX(dr.valor_numero) AS maximo, COUNT(*) AS total
           FROM egresados_unt.detalle_respuestas dr
           JOIN egresados_unt.respuestas_encuesta re ON re.id_respuesta=dr.id_respuesta AND re.completada=TRUE
           WHERE dr.id_pregunta=$1`, [p.id_pregunta]
        );
      } else {
        agg = await db.query(
          `SELECT dr.valor_texto AS valor, dr.valor_opciones, COUNT(*) AS frecuencia
           FROM egresados_unt.detalle_respuestas dr
           JOIN egresados_unt.respuestas_encuesta re ON re.id_respuesta=dr.id_respuesta AND re.completada=TRUE
           WHERE dr.id_pregunta=$1
           GROUP BY dr.valor_texto, dr.valor_opciones ORDER BY frecuencia DESC`, [p.id_pregunta]
        );
      }
      return { pregunta: p, datos: agg.rows };
    }));
    success(res, resultados);
  } catch (e) { next(e); }
};

// POST /api/admin/encuestas (crear encuesta)
exports.crear = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Solo admins', 403);
    const { nombre, descripcion, tipo, preguntas } = req.body;
    if (!nombre || !tipo) return error(res, 'nombre y tipo requeridos', 400);
    const enc = await db.query(
      'INSERT INTO egresados_unt.encuestas (nombre, descripcion, tipo) VALUES ($1,$2,$3) RETURNING id_encuesta',
      [nombre, descripcion, tipo]
    );
    const id_encuesta = enc.rows[0].id_encuesta;
    if (preguntas?.length) {
      for (const p of preguntas) {
        await db.query(
          `INSERT INTO egresados_unt.preguntas_encuesta (id_encuesta, orden, texto, tipo_respuesta, opciones, requerida)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id_encuesta, p.orden, p.texto, p.tipo_respuesta || 'texto', p.opciones ? JSON.stringify(p.opciones) : null, p.requerida !== false]
        );
      }
    }
    success(res, { id_encuesta }, 'Encuesta creada', 201);
  } catch (e) { next(e); }
};

// PUT /api/encuestas/:id (admin)
exports.actualizarEncuesta = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Solo admins', 403);
    const { id } = req.params;
    const { nombre, descripcion, tipo, activa } = req.body || {};
    const r = await db.query(
      `UPDATE egresados_unt.encuestas SET
         nombre=COALESCE($1,nombre),
         descripcion=COALESCE($2,descripcion),
         tipo=COALESCE($3,tipo),
         activa=COALESCE($4,activa)
       WHERE id_encuesta=$5
       RETURNING id_encuesta, nombre, descripcion, tipo, activa`,
      [
        nombre ?? null,
        descripcion ?? null,
        tipo ?? null,
        activa === undefined ? null : !!activa,
        id,
      ]
    );
    if (!r.rows.length) return error(res, 'Encuesta no encontrada', 404);
    success(res, r.rows[0], 'Encuesta actualizada');
  } catch (e) { next(e); }
};

// PATCH /api/encuestas/:id/activa (admin)
exports.toggleEncuesta = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Solo admins', 403);
    const { id } = req.params;
    const { activa } = req.body || {};
    const r = await db.query(
      `UPDATE egresados_unt.encuestas
       SET activa=COALESCE($1, NOT activa)
       WHERE id_encuesta=$2
       RETURNING id_encuesta, nombre, descripcion, tipo, activa`,
      [activa === undefined ? null : !!activa, id]
    );
    if (!r.rows.length) return error(res, 'Encuesta no encontrada', 404);
    success(res, r.rows[0], 'Encuesta actualizada');
  } catch (e) { next(e); }
};

// DELETE /api/encuestas/:id (admin)
exports.eliminarEncuesta = async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Solo admins', 403);
    const { id } = req.params;
    const used = await db.query(
      'SELECT COUNT(*)::int AS n FROM egresados_unt.respuestas_encuesta WHERE id_encuesta=$1',
      [id]
    );
    if ((used.rows[0]?.n || 0) > 0) {
      return error(res, 'No se puede eliminar: ya tiene respuestas. Puedes desactivar la encuesta.', 409);
    }
    await db.query('DELETE FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1', [id]);
    const r = await db.query('DELETE FROM egresados_unt.encuestas WHERE id_encuesta=$1 RETURNING id_encuesta', [id]);
    if (!r.rows.length) return error(res, 'Encuesta no encontrada', 404);
    success(res, { id_encuesta: id }, 'Encuesta eliminada');
  } catch (e) { next(e); }
};
