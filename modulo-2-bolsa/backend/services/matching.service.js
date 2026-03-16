const db = require('../config/database');

const MATCH_SCORE_SQL = `
WITH oferta_h AS (
  SELECT oh.id_habilidad, oh.requerida
  FROM bolsa_laboral.oferta_habilidades oh
  WHERE oh.id_oferta = $2
),
stats AS (
  SELECT
    COUNT(*) FILTER (WHERE requerida = TRUE)::numeric AS total_requeridas,
    COUNT(*) FILTER (WHERE requerida = FALSE)::numeric AS total_opcionales,
    COUNT(DISTINCT eh.id_habilidad) FILTER (WHERE oh.requerida = TRUE)::numeric AS coinciden_requeridas,
    COUNT(DISTINCT eh.id_habilidad) FILTER (WHERE oh.requerida = FALSE)::numeric AS coinciden_opcionales
  FROM oferta_h oh
  LEFT JOIN egresados_unt.egresado_habilidades eh
    ON eh.id_habilidad = oh.id_habilidad
   AND eh.id_egresado = $1
),
perfil_oferta AS (
  SELECT
    pp.modalidad_trabajo,
    pp.pretension_salarial,
    o.modalidad,
    o.salario_max
  FROM bolsa_laboral.ofertas_laborales o
  LEFT JOIN egresados_unt.perfiles_profesionales pp ON pp.id_egresado = $1
  WHERE o.id_oferta = $2
)
SELECT
  ROUND(
    LEAST(
      100,
      GREATEST(
        0,
        (
          CASE
            WHEN s.total_requeridas > 0 THEN (s.coinciden_requeridas / s.total_requeridas) * 60
            WHEN s.total_opcionales > 0 THEN (s.coinciden_opcionales / s.total_opcionales) * 60
            ELSE 30
          END
        ) +
        (
          CASE
            WHEN po.modalidad_trabajo IS NULL OR po.modalidad_trabajo = 'cualquiera' THEN 20
            WHEN po.modalidad = po.modalidad_trabajo THEN 20
            WHEN po.modalidad_trabajo = 'hibrido' OR po.modalidad = 'hibrido' THEN 15
            ELSE 0
          END
        ) +
        (
          CASE
            WHEN po.pretension_salarial IS NULL OR po.salario_max IS NULL OR po.salario_max = 0 THEN 10
            WHEN po.pretension_salarial <= po.salario_max THEN 20
            WHEN po.pretension_salarial <= (po.salario_max * 1.20) THEN 10
            ELSE 0
          END
        )
      )
    )
  )::int AS puntaje
FROM stats s
CROSS JOIN perfil_oferta po;
`;

async function calculateMatchScore(idEgresado, idOferta) {
  const { rows } = await db.query(MATCH_SCORE_SQL, [idEgresado, idOferta]);
  return rows[0]?.puntaje ?? 50;
}

async function listTopRecommendedOffers(idEgresado, limit = 5) {
  const { rows } = await db.query(
    `SELECT
       o.id_oferta,
       o.titulo,
       o.modalidad,
       o.salario_min,
       o.salario_max,
       o.fecha_publicacion,
       emp.nombre_comercial AS empresa,
       emp.logo_url,
       emp.sector
     FROM bolsa_laboral.ofertas_laborales o
     JOIN bolsa_laboral.empresas emp ON emp.id_empresa = o.id_empresa
     WHERE o.estado = 'activa'
       AND o.id_oferta NOT IN (
         SELECT p.id_oferta
         FROM bolsa_laboral.postulaciones p
         WHERE p.id_egresado = $1
       )
     ORDER BY o.fecha_publicacion DESC
     LIMIT 100`,
    [idEgresado]
  );

  const scored = await Promise.all(
    rows.map(async (offer) => ({
      ...offer,
      puntaje_match: await calculateMatchScore(idEgresado, offer.id_oferta),
    }))
  );

  scored.sort((a, b) => b.puntaje_match - a.puntaje_match || new Date(b.fecha_publicacion) - new Date(a.fecha_publicacion));
  return scored.slice(0, limit);
}

module.exports = {
  calculateMatchScore,
  listTopRecommendedOffers,
};
