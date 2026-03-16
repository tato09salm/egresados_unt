import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight: '100vh', background: '#f0f4f8' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '26px 16px 34px' },
  top: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 },
  title: { fontSize: 24, fontWeight: 800, color: '#1a365d' },
  subtitle: { color: '#4a5568', fontSize: 13 },
  btn: { padding: '9px 16px', borderRadius: 9, border: 'none', background: '#1a365d', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 },
  card: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,.04)' },
  kpiLabel: { fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 700 },
  kpiValue: { fontSize: 26, color: '#0f172a', fontWeight: 800 },
  section: { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 15, color: '#1e293b', fontWeight: 800, marginBottom: 10 },
  chartWrap: { display: 'grid', gridTemplateColumns: 'minmax(220px, 260px) 1fr', gap: 16, alignItems: 'start' },
  legendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderBottom: '1px dashed #e2e8f0', padding: '6px 0', fontSize: 13 },
  legendLeft: { display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontWeight: 700 },
  dot: (c) => ({ width: 10, height: 10, borderRadius: '50%', background: c }),
  barRow: { display: 'grid', gridTemplateColumns: '170px 1fr 48px', alignItems: 'center', gap: 10, padding: '6px 0' },
  barTrack: { width: '100%', height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  barFill: (c, w) => ({ width: `${w}%`, height: '100%', background: c, borderRadius: 999 }),
  label: { fontSize: 13, color: '#334155', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  barValue: { textAlign: 'right', fontWeight: 800, fontSize: 12, color: '#0f172a' },
  loading: { textAlign: 'center', color: '#64748b', padding: '42px 12px' },
  error: { background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2', borderRadius: 10, padding: 14, textAlign: 'center' },
};

const PALETTE = ['#2563eb', '#0f766e', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#65a30d', '#475569'];

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item?.[key] || 'sin_dato';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function toRows(obj) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function normalizeChartRows(rows) {
  return rows.map((r, idx) => ({ ...r, value: Number(r.value) || 0, color: PALETTE[idx % PALETTE.length] }));
}

function DonutChart({ rows }) {
  const total = rows.reduce((acc, r) => acc + r.value, 0);
  if (!total) return <div style={{ color: '#94a3b8', fontSize: 13 }}>Sin datos para graficar.</div>;

  let acc = 0;
  const gradients = rows.map((r) => {
    const start = (acc / total) * 100;
    acc += r.value;
    const end = (acc / total) * 100;
    return `${r.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div style={s.chartWrap}>
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(${gradients})` }} />
        <div style={{ position: 'absolute', inset: 42, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Total</div>
          <div style={{ fontSize: 24, color: '#0f172a', fontWeight: 900 }}>{total}</div>
        </div>
      </div>
      <div>
        {rows.map((r) => (
          <div key={r.label} style={s.legendRow}>
            <div style={s.legendLeft}><span style={s.dot(r.color)} />{r.label}</div>
            <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ rows }) {
  if (!rows.length) return <div style={{ color: '#94a3b8', fontSize: 13 }}>Sin datos para graficar.</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} style={s.barRow}>
          <div style={s.label} title={r.label}>{r.label}</div>
          <div style={s.barTrack}>
            <div style={s.barFill(r.color, (r.value / max) * 100)} />
          </div>
          <div style={s.barValue}>{r.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function EstadisticasBolsa() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const rol = user?.rol;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpis, setKpis] = useState([]);
  const [bloques, setBloques] = useState([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        if (rol === 'admin') {
          const [ofertasRes, postRes] = await Promise.all([
            api.get('/api/ofertas?limit=500&page=1&estado=todas'),
            api.get('/api/postulaciones/admin?limit=500&page=1'),
          ]);

          const ofertas = ofertasRes.data?.data || [];
          const posts = postRes.data?.data || [];

          const estadoOfertas = countBy(ofertas, 'estado');
          const estadoPost = countBy(posts, 'estado');
          const sectores = countBy(ofertas, 'sector');
          const empresasUnicas = new Set(ofertas.map((o) => o.id_empresa)).size;

          setKpis([
            { label: 'Ofertas totales', value: ofertas.length },
            { label: 'Empresas con ofertas', value: empresasUnicas },
            { label: 'Postulaciones totales', value: posts.length },
            { label: 'Ofertas activas', value: estadoOfertas.activa || 0 },
          ]);

          setBloques([
            { title: 'Estado de ofertas (global)', type: 'donut', rows: normalizeChartRows(toRows(estadoOfertas)) },
            { title: 'Estado de postulaciones (global)', type: 'donut', rows: normalizeChartRows(toRows(estadoPost)) },
            { title: 'Sectores con mas ofertas', type: 'bar', rows: normalizeChartRows(toRows(sectores).slice(0, 8)) },
          ]);
          return;
        }

        if (rol === 'empresa') {
          const ofertasRes = await api.get('/api/ofertas?mine=true&limit=200&page=1&estado=todas');
          const ofertas = ofertasRes.data?.data || [];

          const postResponses = await Promise.all(
            ofertas.map((o) => api.get(`/api/postulaciones/oferta/${o.id_oferta}?limit=200&page=1`).catch(() => ({ data: { data: [] } })))
          );
          const postulaciones = postResponses.flatMap((r) => r.data?.data || []);

          const estadoOfertas = countBy(ofertas, 'estado');
          const estadoPost = countBy(postulaciones, 'estado');
          const avgPost = ofertas.length ? (postulaciones.length / ofertas.length).toFixed(1) : '0.0';

          setKpis([
            { label: 'Mis ofertas', value: ofertas.length },
            { label: 'Mis postulaciones recibidas', value: postulaciones.length },
            { label: 'Promedio postulantes/oferta', value: avgPost },
            { label: 'Ofertas activas', value: estadoOfertas.activa || 0 },
          ]);

          setBloques([
            { title: 'Estado de mis ofertas', type: 'donut', rows: normalizeChartRows(toRows(estadoOfertas)) },
            { title: 'Estado de mis postulaciones', type: 'donut', rows: normalizeChartRows(toRows(estadoPost)) },
          ]);
          return;
        }

        const [misPostRes, ofertasRes, recomRes] = await Promise.all([
          api.get('/api/postulaciones/mis-postulaciones').catch(() => ({ data: { data: [] } })),
          api.get('/api/ofertas?limit=1&page=1').catch(() => ({ data: { pagination: { total: 0 }, data: [] } })),
          api.get('/api/match/recomendaciones').catch(() => ({ data: { data: [] } })),
        ]);

        const misPost = misPostRes.data?.data || [];
        const totalOfertas = ofertasRes.data?.pagination?.total || 0;
        const recomendaciones = recomRes.data?.data || [];
        const estadoMisPost = countBy(misPost, 'estado');

        const promedioMatch = misPost.length
          ? (misPost.reduce((acc, p) => acc + (Number(p.puntaje_match) || 0), 0) / misPost.length).toFixed(1)
          : '0.0';

        setKpis([
          { label: 'Ofertas disponibles', value: totalOfertas },
          { label: 'Mis postulaciones', value: misPost.length },
          { label: 'Recomendadas para mi', value: recomendaciones.length },
          { label: 'Promedio match personal', value: `${promedioMatch}%` },
        ]);

        setBloques([
          { title: 'Estado de mis postulaciones', type: 'donut', rows: normalizeChartRows(toRows(estadoMisPost)) },
          {
            title: 'Top recomendaciones (match)',
            type: 'bar',
            rows: normalizeChartRows(
              recomendaciones.slice(0, 8).map((r) => ({ label: `${r.titulo} (${r.empresa})`, value: Math.round(Number(r.puntaje_match) || 0) }))
            ),
          },
        ]);
      } catch (e) {
        setError(e.response?.data?.message || 'No se pudieron cargar las estadisticas.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [rol]);

  const titulo = useMemo(() => {
    if (rol === 'admin') return '📊 Estadisticas globales de Bolsa';
    if (rol === 'empresa') return '📈 Estadisticas de mi empresa';
    return '🎯 Estadisticas para egresado';
  }, [rol]);

  return (
    <div style={s.page}>
      <div style={s.body}>
        <div style={s.top}>
          <div>
            <div style={s.title}>{titulo}</div>
            <div style={s.subtitle}>Vista descriptiva segun tu rol para decisiones rapidas.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(rol === 'admin' || rol === 'empresa') && <button style={s.btn} onClick={() => navigate('/bolsa/empresa')}>🏢 Panel Ofertas</button>}
            <button style={s.btn} onClick={() => navigate('/bolsa')}>🏠 Volver a Bolsa</button>
          </div>
        </div>

        {loading && <div style={s.loading}>Cargando estadisticas...</div>}
        {!loading && error && <div style={s.error}>{error}</div>}

        {!loading && !error && (
          <>
            <div style={s.grid}>
              {kpis.map((k) => (
                <div key={k.label} style={s.card}>
                  <div style={s.kpiLabel}>{k.label}</div>
                  <div style={s.kpiValue}>{k.value}</div>
                </div>
              ))}
            </div>

            {bloques.map((b) => (
              <div key={b.title} style={s.section}>
                <div style={s.sectionTitle}>{b.title}</div>
                {b.type === 'donut' ? <DonutChart rows={b.rows} /> : <BarChart rows={b.rows} />}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
