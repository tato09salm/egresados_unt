// modulo-3-seguimiento/backend/routes/reportes.routes.js
const router = require('express').Router();
const db     = require('../config/database');
const PDFDocument = require('pdfkit');
const { verifyToken } = require('../../../shared/middleware/auth');
const { success, error } = require('../../../shared/utils/response');

function sendPdf(res, filename, builder) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(res);
  builder(doc);
  doc.end();
}

function drawTable(doc, { x, y, columns, rows, rowHeight = 18, fontSize = 9 }) {
  let currentY = y;
  doc.fontSize(fontSize).font('Helvetica-Bold');
  columns.forEach((c) => {
    doc.text(c.label, x + c.x, currentY, { width: c.w, ellipsis: true });
  });
  currentY += rowHeight;
  doc.moveTo(x, currentY - 6).lineTo(x + columns.reduce((s, c) => Math.max(s, c.x + c.w), 0), currentY - 6).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.font('Helvetica');
  rows.forEach((r) => {
    if (currentY > 760) {
      doc.addPage();
      currentY = 60;
    }
    columns.forEach((c) => {
      const val = r[c.key] ?? '';
      doc.text(String(val), x + c.x, currentY, { width: c.w, ellipsis: true });
    });
    currentY += rowHeight;
  });
  return currentY;
}

// ─── GET /api/reportes/empleabilidad ──────────────────────────────────────────
// Filtros opcionales: ?anio=2024&escuela=<uuid>&facultad=<uuid>
router.get('/empleabilidad', verifyToken, async (req, res, next) => {
  try {
    const { anio, escuela, facultad } = req.query;
    const cond = []; const params = []; let idx = 1;

    if (anio)    { cond.push(`ie.anio = $${idx++}`);          params.push(Number(anio)); }
    if (escuela) { cond.push(`ie.id_escuela = $${idx++}`);    params.push(escuela); }
    if (facultad){ cond.push(`es.id_facultad = $${idx++}`);   params.push(facultad); }

    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

    const r = await db.query(
      `SELECT
         ie.id_indicador,
         ie.anio,
         ie.mes,
         ie.tasa_empleabilidad,
         ie.tiempo_promedio_empleo,
         ie.salario_promedio,
         ie.sector_predominante,
         es.id_escuela,
         es.nombre        AS escuela,
         f.id_facultad,
         f.nombre         AS facultad
       FROM egresados_unt.indicadores_empleabilidad ie
       JOIN egresados_unt.escuelas   es ON es.id_escuela  = ie.id_escuela
       JOIN egresados_unt.facultades f  ON f.id_facultad  = es.id_facultad
       ${where}
       ORDER BY ie.anio DESC, ie.mes DESC NULLS LAST`,
      params
    );
    return success(res, r.rows);
  } catch (e) { next(e); }
});

router.get('/pdf/:tipo', verifyToken, async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);
    const tipo = String(req.params.tipo || '').toLowerCase();
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (tipo === 'postulaciones') {
      const limit = Math.min(parseInt(req.query.limit || '2000', 10), 5000);
      const r = await db.query(
        `SELECT
           p.estado,
           p.puntaje_match,
           p.fecha_postulacion,
           o.titulo,
           emp.nombre_comercial AS empresa,
           per.nombres,
           per.apellidos
         FROM bolsa_laboral.postulaciones p
         JOIN bolsa_laboral.ofertas_laborales o ON o.id_oferta=p.id_oferta
         JOIN bolsa_laboral.empresas emp ON emp.id_empresa=o.id_empresa
         JOIN egresados_unt.egresados eg ON eg.id_egresado=p.id_egresado
         JOIN egresados_unt.personas per ON per.id_persona=eg.id_persona
         ORDER BY p.fecha_postulacion DESC
         LIMIT $1`,
        [limit]
      );
      const rows = r.rows.map((p) => ({
        fecha: p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-PE') : '',
        egresado: `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
        empresa: p.empresa || '',
        oferta: p.titulo || '',
        estado: p.estado || '',
        match: p.puntaje_match ?? '',
      }));
      return sendPdf(res, `postulaciones_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Postulaciones', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.7);
        drawTable(doc, {
          x: 40,
          y: 110,
          columns: [
            { key: 'fecha', label: 'Fecha', x: 0, w: 55 },
            { key: 'egresado', label: 'Egresado', x: 60, w: 120 },
            { key: 'empresa', label: 'Empresa', x: 185, w: 105 },
            { key: 'oferta', label: 'Oferta', x: 295, w: 160 },
            { key: 'estado', label: 'Estado', x: 460, w: 55 },
            { key: 'match', label: 'Match', x: 520, w: 35 },
          ],
          rows,
          rowHeight: 16,
          fontSize: 8,
        });
      });
    }

    if (tipo === 'facultad') {
      const facultad = req.query.facultad;
      const anio = req.query.anio ? Number(req.query.anio) : null;
      if (!facultad) return error(res, 'facultad requerido', 400);

      const fac = await db.query('SELECT nombre FROM egresados_unt.facultades WHERE id_facultad=$1', [facultad]);
      const facName = fac.rows[0]?.nombre || 'Facultad';

      const params = [facultad];
      let cond = '';
      if (anio) {
        params.push(anio);
        cond = ' AND ie.anio=$2';
      }

      const esc = await db.query(
        `SELECT es.nombre,
                ROUND(AVG(ie.tasa_empleabilidad)::numeric, 1) AS tasa,
                ROUND(AVG(ie.salario_promedio)::numeric, 0)   AS salario
         FROM egresados_unt.escuelas es
         LEFT JOIN egresados_unt.indicadores_empleabilidad ie ON ie.id_escuela=es.id_escuela
         WHERE es.id_facultad=$1${cond}
         GROUP BY es.id_escuela, es.nombre
         ORDER BY tasa DESC NULLS LAST`,
        params
      );

      const rows = esc.rows.map((e) => ({
        escuela: e.nombre || '',
        empleabilidad: e.tasa ?? '',
        salario: e.salario ?? '',
      }));

      return sendPdf(res, `facultad_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Seguimiento por Facultad', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`${facName}${anio ? ` • Año ${anio}` : ''}`);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.7);
        drawTable(doc, {
          x: 40,
          y: 130,
          columns: [
            { key: 'escuela', label: 'Escuela', x: 0, w: 280 },
            { key: 'empleabilidad', label: 'Empleabilidad (%)', x: 285, w: 120 },
            { key: 'salario', label: 'Salario prom. (S/.)', x: 410, w: 130 },
          ],
          rows,
          rowHeight: 18,
          fontSize: 9,
        });
      });
    }

    if (tipo === 'resumen') {
      const r = await db.query(
        `SELECT ie.anio,
                ROUND(AVG(ie.tasa_empleabilidad)::numeric, 1)     AS tasa_empleabilidad,
                ROUND(AVG(ie.tiempo_promedio_empleo)::numeric, 1) AS tiempo_promedio,
                ROUND(AVG(ie.salario_promedio)::numeric, 0)       AS salario_promedio
         FROM egresados_unt.indicadores_empleabilidad ie
         WHERE ie.anio >= EXTRACT(YEAR FROM NOW()) - 3
         GROUP BY ie.anio ORDER BY ie.anio`
      );
      const kpis = await db.query(
        `SELECT
           COUNT(DISTINCT e.id_egresado) AS total_egresados,
           COUNT(DISTINCT CASE WHEN e.situacion_laboral='empleado' THEN e.id_egresado END) AS empleados,
           COUNT(DISTINCT o.id_oferta)   AS ofertas_activas,
           COUNT(DISTINCT p.id_postulacion) AS postulaciones_mes
         FROM egresados_unt.egresados e
         CROSS JOIN (SELECT COUNT(*) FROM bolsa_laboral.ofertas_laborales WHERE estado='activa') o(id_oferta)
         CROSS JOIN (SELECT COUNT(*) FROM bolsa_laboral.postulaciones WHERE fecha_postulacion >= NOW()-INTERVAL '30 days') p(id_postulacion)`
      );
      const k = kpis.rows[0] || {};
      return sendPdf(res, `resumen_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Resumen General', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.8);

        doc.fillColor('#1a202c').fontSize(12).text('KPIs', { underline: true });
        doc.moveDown(0.4);
        doc.fontSize(10).fillColor('#1a202c');
        doc.text(`Total egresados: ${k.total_egresados || 0}`);
        doc.text(`Empleados: ${k.empleados || 0}`);
        doc.text(`Ofertas activas: ${k.ofertas_activas || 0}`);
        doc.text(`Postulaciones (30d): ${k.postulaciones_mes || 0}`);
        doc.moveDown(0.8);

        doc.fillColor('#1a202c').fontSize(12).text('Tendencias', { underline: true });
        drawTable(doc, {
          x: 40,
          y: doc.y + 12,
          columns: [
            { key: 'anio', label: 'Año', x: 0, w: 60 },
            { key: 'tasa_empleabilidad', label: 'Empleabilidad (%)', x: 65, w: 140 },
            { key: 'salario_promedio', label: 'Salario prom. (S/.)', x: 210, w: 160 },
            { key: 'tiempo_promedio', label: 'Tiempo empleo (m)', x: 375, w: 140 },
          ],
          rows: r.rows,
          rowHeight: 18,
          fontSize: 9,
        });
      });
    }

    if (tipo === 'prediccion') {
      return sendPdf(res, `prediccion_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Predicción de Tendencias', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.8);
        doc.fillColor('#1a202c').fontSize(11).text('Proyección 2025–2027 (beta)', { underline: true });
        doc.moveDown(0.6);
        doc.fontSize(10).fillColor('#1a202c').text('Este reporte se genera a partir de un modelo de proyección. La versión actual usa datos de ejemplo.');
        doc.moveDown(0.8);
        drawTable(doc, {
          x: 40,
          y: doc.y + 12,
          columns: [
            { key: 'habilidad', label: 'Habilidad', x: 0, w: 320 },
            { key: 'demanda', label: 'Demanda (%)', x: 330, w: 120 },
          ],
          rows: [
            { habilidad: 'Machine Learning', demanda: 92 },
            { habilidad: 'Cloud AWS', demanda: 87 },
            { habilidad: 'React / Vue', demanda: 83 },
            { habilidad: 'Python Data', demanda: 81 },
            { habilidad: 'Power BI', demanda: 74 },
            { habilidad: 'Docker', demanda: 68 },
          ],
          rowHeight: 18,
          fontSize: 10,
        });
      });
    }

    if (tipo === 'sunedu') {
      return sendPdf(res, `sunedu_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — SUNEDU / Acreditación', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.8);
        doc.fillColor('#1a202c').fontSize(11).text('Plantillas disponibles', { underline: true });
        drawTable(doc, {
          x: 40,
          y: doc.y + 12,
          columns: [
            { key: 'plantilla', label: 'Plantilla', x: 0, w: 180 },
            { key: 'descripcion', label: 'Descripción', x: 185, w: 260 },
            { key: 'salida', label: 'Salida', x: 450, w: 80 },
          ],
          rows: [
            { plantilla: 'Informe SUNEDU', descripcion: 'Seguimiento de graduados anual', salida: 'PDF' },
            { plantilla: 'SINEACE', descripcion: 'Acreditación empleabilidad', salida: 'PDF' },
            { plantilla: 'Reporte Decano', descripcion: 'Dashboard ejecutivo', salida: 'XLSX' },
            { plantilla: 'Datos abiertos', descripcion: 'Exportar dataset', salida: 'CSV' },
          ],
          rowHeight: 18,
          fontSize: 10,
        });
      });
    }

    if (tipo === 'mapa') {
      return sendPdf(res, `mapa_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Mapa Laboral', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.8);
        doc.fillColor('#1a202c').fontSize(11).text('Top regiones', { underline: true });
        drawTable(doc, {
          x: 40,
          y: doc.y + 12,
          columns: [
            { key: 'region', label: 'Región', x: 0, w: 360 },
            { key: 'egresados', label: 'Egresados', x: 370, w: 140 },
          ],
          rows: [
            { region: 'La Libertad', egresados: 147 },
            { region: 'Lima', egresados: 89 },
            { region: 'Arequipa', egresados: 23 },
            { region: 'Áncash', egresados: 12 },
            { region: 'Piura', egresados: 8 },
            { region: 'Exterior', egresados: 6 },
          ],
          rowHeight: 18,
          fontSize: 10,
        });
      });
    }

    if (tipo === 'encuesta') {
      const id_encuesta = req.query.id_encuesta;
      if (!id_encuesta) return error(res, 'id_encuesta requerido', 400);
      const enc = await db.query('SELECT nombre, descripcion, tipo FROM egresados_unt.encuestas WHERE id_encuesta=$1', [id_encuesta]);
      if (!enc.rows.length) return error(res, 'Encuesta no encontrada', 404);
      const hasCol = await db.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema='egresados_unt' AND table_name='preguntas_encuesta' AND column_name='habilitada' LIMIT 1`
      );
      const where = hasCol.rows.length ? '' : '';
      const pregs = await db.query(
        `SELECT id_pregunta, orden, texto, tipo_respuesta, requerida${hasCol.rows.length ? ', habilitada' : ''}
         FROM egresados_unt.preguntas_encuesta
         WHERE id_encuesta=$1
         ORDER BY orden`,
        [id_encuesta]
      );
      const rows = pregs.rows.map((p) => ({
        orden: p.orden,
        requerida: p.requerida ? 'Sí' : 'No',
        habilitada: hasCol.rows.length ? (p.habilitada ? 'Sí' : 'No') : '—',
        tipo: p.tipo_respuesta,
        texto: p.texto,
      }));
      return sendPdf(res, `encuesta_${stamp}.pdf`, (doc) => {
        doc.fillColor('#1a365d').fontSize(16).text('Reporte — Encuesta (Preguntas)', { align: 'left' });
        doc.moveDown(0.3);
        doc.fillColor('#4a5568').fontSize(10).text(`${enc.rows[0].nombre} • ${enc.rows[0].tipo}`);
        doc.fillColor('#4a5568').fontSize(10).text(`Generado: ${now.toLocaleString('es-PE')}`);
        doc.moveDown(0.8);
        drawTable(doc, {
          x: 40,
          y: 130,
          columns: [
            { key: 'orden', label: '#', x: 0, w: 30 },
            { key: 'habilitada', label: 'Hab.', x: 35, w: 35 },
            { key: 'requerida', label: 'Req.', x: 75, w: 35 },
            { key: 'tipo', label: 'Tipo', x: 115, w: 90 },
            { key: 'texto', label: 'Pregunta', x: 210, w: 320 },
          ],
          rows,
          rowHeight: 18,
          fontSize: 9,
        });
      });
    }

    return error(res, 'Tipo de PDF inválido', 400);
  } catch (e) { next(e); }
});

// ─── GET /api/reportes/postulaciones ──────────────────────────────────────────
// Solo admin. Filtros: ?limit=500&estado=aceptado&escuela=<uuid>
router.get('/postulaciones', verifyToken, async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);

    const limit  = Math.min(parseInt(req.query.limit  || '500', 10), 2000);
    const { estado, escuela, facultad } = req.query;

    const cond   = []; const params = [limit]; let idx = 2;
    if (estado)  { cond.push(`p.estado = $${idx++}`);          params.push(estado); }
    if (escuela) { cond.push(`e.id_escuela = $${idx++}`);      params.push(escuela); }
    if (facultad){ cond.push(`es2.id_facultad = $${idx++}`);   params.push(facultad); }

    const where = cond.length ? 'AND ' + cond.join(' AND ') : '';

    const r = await db.query(
      `SELECT
         p.id_postulacion,
         p.estado,
         p.puntaje_match,
         p.carta_presentacion,
         p.fecha_postulacion,
         o.id_oferta,
         o.titulo,
         o.modalidad,
         o.tipo_contrato,
         o.salario_min,
         o.salario_max,
         emp.nombre_comercial  AS empresa,
         emp.sector            AS sector_empresa,
         per.nombres,
         per.apellidos,
         per.email,
         eg.codigo_universitario,
         eg.promocion,
         eg.anio_titulacion,
         es2.nombre            AS escuela,
         f2.nombre             AS facultad
       FROM bolsa_laboral.postulaciones p
       JOIN bolsa_laboral.ofertas_laborales o   ON o.id_oferta    = p.id_oferta
       JOIN bolsa_laboral.empresas emp           ON emp.id_empresa = o.id_empresa
       JOIN egresados_unt.egresados eg           ON eg.id_egresado = p.id_egresado
       JOIN egresados_unt.personas  per          ON per.id_persona = eg.id_persona
       JOIN egresados_unt.escuelas  es2          ON es2.id_escuela = eg.id_escuela
       JOIN egresados_unt.facultades f2          ON f2.id_facultad = es2.id_facultad
       WHERE 1=1 ${where}
       ORDER BY p.fecha_postulacion DESC
       LIMIT $1`,
      params
    );
    return success(res, r.rows);
  } catch (e) { next(e); }
});

// ─── GET /api/reportes/egresados ──────────────────────────────────────────────
// Listado completo para exportar. Solo admin.
// Filtros: ?escuela=<uuid>&facultad=<uuid>&anio_egreso=2023&situacion=empleado
router.get('/egresados', verifyToken, async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);

    const limit = Math.min(parseInt(req.query.limit || '2000', 10), 5000);
    const { escuela, facultad, anio_egreso, situacion } = req.query;

    const cond = []; const params = [limit]; let idx = 2;
    if (escuela)    { cond.push(`eg.id_escuela = $${idx++}`);        params.push(escuela); }
    if (facultad)   { cond.push(`es.id_facultad = $${idx++}`);       params.push(facultad); }
    if (anio_egreso){ cond.push(`eg.anio_egreso = $${idx++}`);       params.push(Number(anio_egreso)); }
    if (situacion)  { cond.push(`eg.situacion_laboral = $${idx++}`); params.push(situacion); }

    const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';

    const r = await db.query(
      `SELECT
         per.nombres,
         per.apellidos,
         per.email,
         per.telefono,
         eg.codigo_universitario,
         eg.promocion,
         eg.anio_ingreso,
         eg.anio_egreso,
         eg.anio_titulacion,
         eg.promedio,
         eg.situacion_laboral,
         es.nombre   AS escuela,
         f.nombre    AS facultad
       FROM egresados_unt.egresados eg
       JOIN egresados_unt.personas  per ON per.id_persona  = eg.id_persona
       JOIN egresados_unt.escuelas  es  ON es.id_escuela   = eg.id_escuela
       JOIN egresados_unt.facultades f  ON f.id_facultad   = es.id_facultad
       ${where}
       ORDER BY f.nombre, es.nombre, per.apellidos
       LIMIT $1`,
      params
    );
    return success(res, r.rows);
  } catch (e) { next(e); }
});

// ─── GET /api/reportes/encuestas ──────────────────────────────────────────────
// Resultados agregados de encuesta. Solo admin.
// Requerido: ?id_encuesta=<uuid>
router.get('/encuestas', verifyToken, async (req, res, next) => {
  try {
    if (req.user.rol !== 'admin') return error(res, 'Sin permiso', 403);

    const { id_encuesta } = req.query;
    if (!id_encuesta) return error(res, 'id_encuesta requerido', 400);

    // Resumen de respuestas por pregunta
    const r = await db.query(
      `SELECT
         pq.id_pregunta,
         pq.orden,
         pq.texto,
         pq.tipo_respuesta,
         COUNT(dr.id_detalle)                           AS total_respuestas,
         AVG(dr.valor_numero)                           AS promedio_numero,
         MIN(dr.valor_numero)                           AS minimo,
         MAX(dr.valor_numero)                           AS maximo
       FROM egresados_unt.preguntas_encuesta pq
       LEFT JOIN egresados_unt.detalle_respuestas dr ON dr.id_pregunta = pq.id_pregunta
       WHERE pq.id_encuesta = $1
       GROUP BY pq.id_pregunta, pq.orden, pq.texto, pq.tipo_respuesta
       ORDER BY pq.orden`,
      [id_encuesta]
    );

    // Conteo de respuestas completadas
    const meta = await db.query(
      `SELECT
         COUNT(*)                               AS total,
         COUNT(*) FILTER (WHERE completada)     AS completadas
       FROM egresados_unt.respuestas_encuesta
       WHERE id_encuesta = $1`,
      [id_encuesta]
    );

    return success(res, {
      meta: meta.rows[0],
      preguntas: r.rows,
    });
  } catch (e) { next(e); }
});

module.exports = router;
