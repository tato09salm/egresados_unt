const db = require('../config/database');
const { success, error } = require('../../../shared/utils/response');

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

// GET /api/encuestas/:id - Obtener encuesta con preguntas
exports.getById = async (req, res, next) => {
  try {
    const enc = await db.query('SELECT * FROM egresados_unt.encuestas WHERE id_encuesta=$1', [req.params.id]);
    if (!enc.rows.length) return error(res, 'Encuesta no encontrada', 404);
    const pregs = await db.query(
      'SELECT * FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 ORDER BY orden',
      [req.params.id]
    );
    success(res, { ...enc.rows[0], preguntas: pregs.rows });
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
    const total = await client.query('SELECT COUNT(*) FROM egresados_unt.preguntas_encuesta WHERE id_encuesta=$1 AND requerida=TRUE', [id]);
    const respondidas = await client.query(
      `SELECT COUNT(*) FROM egresados_unt.detalle_respuestas dr
       JOIN egresados_unt.preguntas_encuesta pq ON pq.id_pregunta=dr.id_pregunta
       WHERE dr.id_respuesta=$1 AND pq.requerida=TRUE`, [id_respuesta]
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
