import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import api from '../services/api';

Chart.register(...registerables);

const COLORS = {
  blue: '#1e3a5f', green: '#276749', amber: '#744210', purple: '#553c9a', teal: '#2d6a9f',
};

// Mini chart usando Canvas sin Chart.js (fallback SVG para barras simples)
function BarChart({ data = [], valueKey = 'value', labelKey = 'label', color = COLORS.blue }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: color, borderRadius: 4, barThickness: 32 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (!data.length) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update('none');
      return;
    }
    chart.data.labels = data.map(d => d[labelKey]);
    chart.data.datasets[0].data = data.map(d => d[valueKey]);
    chart.data.datasets[0].backgroundColor = color;
    chart.update('none');
  }, [data, valueKey, labelKey, color]);
  if (!data.length) return <p style={{ color: '#a0aec0', fontSize: 13, padding: 20 }}>Sin datos</p>;
  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function LineChart({ datasets = [], labels = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('none');
  }, [datasets, labels]);

  return (
    <div style={{ width: '100%', height: 200, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function DonutChart({ data = [], labels = [], colors = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0, hoverOffset: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        animation: false,
        plugins: { legend: { display: false } },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update('none');
  }, [data, labels, colors]);

  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function KpiCard({ label, value, unit = '', delta, deltaUp = true, color }) {
  return (
    <div style={{ background: 'var(--bg-card, #fff)', border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: 0 }} />
      <div style={{ paddingLeft: 10 }}>
        <div style={{ fontSize: 12, color, fontWeight: 500, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color, lineHeight: 1 }}>{value}{unit}</div>
        {delta && (
          <div style={{
            display: 'inline-block', marginTop: 6, padding: '2px 7px', borderRadius: 4, fontSize: 11,
            background: deltaUp ? 'rgba(39,103,73,.12)' : 'rgba(162,45,45,.12)',
            color: deltaUp ? '#276749' : '#a32d2d',
          }}>{delta}</div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .6s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 36, textAlign: 'right', color }}>{value}%</span>
    </div>
  );
}

function Badge({ type = 'info', children }) {
  const styles = {
    ok: { background: 'rgba(39,103,73,.12)', color: '#276749' },
    warn: { background: 'rgba(116,66,16,.12)', color: '#744210' },
    info: { background: 'rgba(30,58,95,.1)', color: '#1e3a5f' },
    danger: { background: 'rgba(162,45,45,.12)', color: '#a32d2d' },
  };
  return (
    <span style={{ ...styles[type], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, display: 'inline-block' }}>{children}</span>
  );
}

const TABS = ['overview', 'facultad', 'prediccion', 'reporte', 'mapa'];
const TAB_LABELS = ['Resumen general', 'Por facultad', 'Predicción tendencias', 'Reportes SUNEDU', 'Mapa laboral'];

// ─── Datos mock (reemplazar con llamadas a api.get cuando implementes el back) ───
const MOCK_KPIS   = { total_egresados: 6, empleados: 5, ofertas_activas: 1, postulaciones_mes: 1 };
const MOCK_TEND   = [
  { anio: 2022, tasa_empleabilidad: 80, salario_promedio: 3100, tiempo_promedio: 4.8 },
  { anio: 2023, tasa_empleabilidad: 83, salario_promedio: 3350, tiempo_promedio: 4.2 },
  { anio: 2024, tasa_empleabilidad: 88, salario_promedio: 3700, tiempo_promedio: 3.8 },
];
const MOCK_ENCPEND = [
  { id_encuesta: 'f1000000-0000-0000-0000-000000000001', nombre: 'Seguimiento 1 año — 2024' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis]           = useState(MOCK_KPIS);
  const [tendencias, setTend]     = useState(MOCK_TEND);
  const [encPend, setEncPend]     = useState(MOCK_ENCPEND);
  const [metrica, setMetrica]     = useState('tasa');
  const [loading, setLoading]     = useState(false);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  // ── cuando implementes el back, descomenta esto: ──────────────────────────────
  // useEffect(() => {
  //   Promise.all([
  //     api.get('/api/dashboard/tendencias'),
  //     api.get('/api/encuestas/pendientes').catch(() => ({ data: { data: [] } })),
  //   ]).then(([dash, enc]) => {
  //     setKpis(dash.data.data?.kpis);
  //     setTend(dash.data.data?.tendencias || []);
  //     setEncPend(enc.data.data || []);
  //   }).catch(() => navigate('/login'))
  //   .finally(() => setLoading(false));
  // }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  const logout = () => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    navigate('/login');
  };

  const METRICA_MAP = {
    tasa:    { label: 'Empleabilidad (%)',    key: 'tasa_empleabilidad', color: COLORS.blue },
    salario: { label: 'Salario prom. (S/.)',  key: 'salario_promedio',   color: COLORS.green },
    tiempo:  { label: 'Tiempo empleo (m)',    key: 'tiempo_promedio',    color: COLORS.amber },
  };

  const mainBarData = tendencias.map(d => ({
    label: String(d.anio),
    value: parseFloat(d[METRICA_MAP[metrica].key]) || 0,
  }));

  const escuelas = [
    { n: 'Ing. Informática', v: 88, c: COLORS.blue },
    { n: 'Ing. Industrial',  v: 78, c: COLORS.green },
    { n: 'Administración',   v: 74, c: COLORS.purple },
    { n: 'Ing. Civil',       v: 71, c: COLORS.amber },
    { n: 'Economía',         v: 68, c: COLORS.teal },
    { n: 'Medicina',         v: 82, c: COLORS.green },
  ];

  const demanda = [
    { n: 'Machine Learning', v: 92 }, { n: 'Cloud AWS',  v: 87 },
    { n: 'React / Vue',      v: 83 }, { n: 'Python Data', v: 81 },
    { n: 'Power BI',         v: 74 }, { n: 'Docker',      v: 68 },
  ];

  const S = {
    shell:   { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, sans-serif' },
    content: { padding: 24, maxWidth: 1200, margin: '0 auto' },
    card:    { background: '#fff', border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: 20 },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 },
    row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    row3:    { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 },
    cardH:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardT:   { fontSize: 14, fontWeight: 500, color: '#1a202c' },
    chip:    (sel) => ({ padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `0.5px solid ${sel ? COLORS.blue : 'rgba(0,0,0,.15)'}`, background: sel ? COLORS.blue : '#fff', color: sel ? '#fff' : '#718096', marginLeft: 4 }),
    tabSub:  { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
    tabItem: (sel) => ({ padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: `0.5px solid ${sel ? 'rgba(0,0,0,.15)' : 'rgba(0,0,0,.06)'}`, background: sel ? '#fff' : 'transparent', color: sel ? '#1a202c' : '#718096', fontWeight: sel ? 500 : 400 }),
    table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th:      { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 500, color: '#718096', borderBottom: '0.5px solid rgba(0,0,0,.06)' },
    td:      { padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,.04)', color: '#1a202c' },
    alertBox:{ background: 'rgba(116,66,16,.06)', border: '0.5px solid rgba(116,66,16,.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    btnSm:   { padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,.15)', background: '#fff', color: '#1a202c' },
    btnPri:  { padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none', background: COLORS.blue, color: '#fff', fontWeight: 500 },
    predCard:{ background: 'rgba(0,0,0,.03)', borderRadius: 8, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 },
    predIcon:{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 500 },
    suneduG: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    suneduI: (c) => ({ background: 'rgba(0,0,0,.02)', borderRadius: 8, padding: 12, borderLeft: `3px solid ${c}` }),
    encRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,.05)' },
    mapGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    regCard: { background: 'rgba(0,0,0,.03)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sectionT:{ fontSize: 18, fontWeight: 500, color: '#1a202c', marginBottom: 6 },
    sectionS:{ fontSize: 13, color: '#718096', marginBottom: 20 },
  };

  return (
    <div style={S.shell}>
      <div style={S.content}>
        {/* Alert encuestas pendientes */}
        {encPend.length > 0 && (
          <div style={S.alertBox}>
            <span style={{ fontSize: 13, color: COLORS.amber, fontWeight: 500 }}>
              Tienes {encPend.length} encuesta{encPend.length > 1 ? 's' : ''} pendiente{encPend.length > 1 ? 's' : ''} de responder
            </span>
            <button style={S.btnPri} onClick={() => navigate('/encuesta/' + encPend[0].id_encuesta)}>
              Responder ahora →
            </button>
          </div>
        )}

        {/* Sub-tabs */}
        <div style={S.tabSub}>
          {TABS.map((t, i) => (
            <button key={t} style={S.tabItem(activeTab === t)} onClick={() => setActiveTab(t)}>
              {TAB_LABELS[i]}
            </button>
          ))}
        </div>

        {/* ── TAB: RESUMEN ── */}
        {activeTab === 'overview' && (
          <>
            <div style={S.kpiGrid}>
              <KpiCard label="Total egresados" value={kpis?.total_egresados || 0} color={COLORS.blue}  delta="+12% vs 2023" deltaUp />
              <KpiCard label="Empleabilidad"   value={`${Math.round((kpis?.empleados / kpis?.total_egresados) * 100) || 0}%`} color={COLORS.green}  delta="+3.5 pts vs 2023" deltaUp />
              <KpiCard label="Salario prom."   value="S/. 3,450" color={COLORS.amber}  delta="+8.2% vs 2023" deltaUp />
              <KpiCard label="Tiempo empleo"   value="3.8m"     color={COLORS.purple} delta="−0.4m mejora" deltaUp />
            </div>
            <div style={S.row3}>
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={S.cardT}>Tendencia histórica</span>
                  <div>
                    {['tasa','salario','tiempo'].map(m => (
                      <span key={m} style={S.chip(metrica === m)} onClick={() => setMetrica(m)}>
                        {m === 'tasa' ? 'Empleabilidad' : m === 'salario' ? 'Salario' : 'Tiempo'}
                      </span>
                    ))}
                  </div>
                </div>
                <BarChart data={mainBarData} valueKey="value" labelKey="label" color={METRICA_MAP[metrica].color} />
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Por sector</span></div>
                <DonutChart
                  data={[42,25,18,15]}
                  labels={['Tecnología','Manufactura','Servicios','Otros']}
                  colors={[COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple]}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {[['Tecnología','#1e3a5f','42%'],['Manufactura','#276749','25%'],['Servicios','#744210','18%'],['Otros','#553c9a','15%']].map(([l,c,v]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#718096' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                      {l} {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Empleabilidad por escuela</span><button style={S.btnSm}>Exportar</button></div>
                {escuelas.map(e => <ProgressBar key={e.n} label={e.n} value={e.v} color={e.c} />)}
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Últimas postulaciones</span></div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Egresado</th><th style={S.th}>Oferta</th><th style={S.th}>Estado</th><th style={S.th}>Match</th></tr></thead>
                  <tbody>
                    {[['J. García','Dev Full Stack','ok','Aceptado','91%'],['L. Torres','Analista Datos','info','Entrevista','84%'],['M. Ríos','Ing. Industrial','warn','Revisión','72%'],['K. Paz','Dev Backend','info','Entrevista','88%'],['R. Flores','Data Scientist','ok','Aceptado','95%']].map(([n,o,t,s,m]) => (
                      <tr key={n}><td style={S.td}>{n}</td><td style={S.td}>{o}</td><td style={S.td}><Badge type={t}>{s}</Badge></td><td style={S.td}><strong>{m}</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: FACULTAD ── */}
        {activeTab === 'facultad' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#718096' }}>Facultad:</span>
              <select style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}>
                <option>Ingeniería</option><option>Ciencias Económicas</option><option>Cs. Físicas y Matemáticas</option><option>Medicina</option>
              </select>
              <span style={{ fontSize: 12, color: '#718096' }}>Año:</span>
              <select style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}>
                <option>2024</option><option>2023</option><option>2022</option>
              </select>
            </div>
            <div style={S.kpiGrid}>
              <KpiCard label="Escuelas" value={3} color={COLORS.blue} />
              <KpiCard label="Empleabilidad facultad" value="86.2%" color={COLORS.green} delta="+4.1 pts vs 2023" deltaUp />
              <KpiCard label="Mejor: Informática" value="88.3%" color={COLORS.amber} delta="+4.7 pts" deltaUp />
              <KpiCard label="Salario prom." value="S/. 3,700" color={COLORS.purple} delta="+6.2%" deltaUp />
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Comparativa de escuelas — Empleabilidad (%)</span></div>
                <BarChart
                  data={[{label:'Informática',value:88},{label:'Industrial',value:78},{label:'Civil',value:71}]}
                  valueKey="value" labelKey="label" color={COLORS.blue}
                />
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Detalle 2024</span></div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Escuela</th><th style={S.th}>Emplea.</th><th style={S.th}>Salario</th><th style={S.th}>T.Empleo</th></tr></thead>
                  <tbody>
                    <tr><td style={S.td}>Informática</td><td style={S.td}><Badge type="ok">88.3%</Badge></td><td style={S.td}>S/. 3,700</td><td style={S.td}>3.5m</td></tr>
                    <tr><td style={S.td}>Industrial</td><td style={S.td}><Badge type="ok">78.5%</Badge></td><td style={S.td}>S/. 3,000</td><td style={S.td}>4.8m</td></tr>
                    <tr><td style={S.td}>Civil</td><td style={S.td}><Badge type="warn">71.0%</Badge></td><td style={S.td}>S/. 2,800</td><td style={S.td}>5.2m</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: PREDICCIÓN ── */}
        {activeTab === 'prediccion' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Predicción de tendencias ocupacionales</div>
              <div style={S.sectionS}>Proyección 2025–2027 basada en datos históricos y análisis de mercado laboral regional</div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={S.cardT}>Proyección de empleabilidad 2025–2027</span>
                  <Badge type="info">IA Beta</Badge>
                </div>
                <LineChart
                  labels={['2020','2021','2022','2023','2024','2025*','2026*','2027*']}
                  datasets={[
                    { label: 'Histórico', data: [74,77,80,78,83,null,null,null], borderColor: COLORS.blue, backgroundColor: 'rgba(30,58,95,.08)', fill: true, tension: .4, pointRadius: 4 },
                    { label: 'Proyección', data: [null,null,null,null,83,87,89,91], borderColor: COLORS.green, backgroundColor: 'rgba(39,103,73,.08)', fill: true, tension: .4, pointRadius: 4, borderDash: [5,5] },
                  ]}
                />
                <div style={{ marginTop: 10, fontSize: 12, color: '#718096' }}>Basado en 847 registros históricos — Confianza: 82%</div>
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Habilidades más demandadas 2025</span></div>
                {demanda.map(d => <ProgressBar key={d.n} label={d.n} value={d.v} color={COLORS.blue} />)}
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Alertas de mercado</span></div>
                {[
                  { icon: '↓', iconBg: 'rgba(162,45,45,.1)', title: 'Ing. Civil — demanda bajando', sub: 'Sector construcción reduce 12% en proyecciones 2025' },
                  { icon: '↑', iconBg: 'rgba(39,103,73,.1)', title: 'Ciencia de datos — alta demanda', sub: 'Crecimiento +34% sector tecnología La Libertad' },
                  { icon: '★', iconBg: 'rgba(30,58,95,.1)', title: 'Trabajo remoto — 40% de ofertas', sub: 'Informática lidera empleabilidad remota en la región' },
                ].map((a,i) => (
                  <div key={i} style={S.predCard}>
                    <div style={{ ...S.predIcon, background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Recomendaciones curriculares</span></div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Carrera</th><th style={S.th}>Agregar al plan</th><th style={S.th}>Impacto</th></tr></thead>
                  <tbody>
                    {[['Informática','Cloud AWS/Azure','ok'],['Industrial','Lean + IA','ok'],['Administración','Analítica datos','info'],['Economía','Power BI + Python','ok'],['Civil','BIM Revit','info']].map(([c,t,b]) => (
                      <tr key={c}><td style={S.td}>{c}</td><td style={S.td}>{t}</td><td style={S.td}><Badge type={b}>{b==='ok'?'Alto':'Medio'}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: REPORTES SUNEDU ── */}
        {activeTab === 'reporte' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Reportes para SUNEDU y acreditadoras</div>
              <div style={S.sectionS}>Generación automática en formato estándar — Resolución SUNEDU N° 012-2024</div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Plantillas disponibles</span></div>
                <div style={S.suneduG}>
                  {[
                    { title: 'Informe SUNEDU', sub: 'Seguimiento de graduados anual', c: COLORS.blue, btn: 'Generar PDF', pri: true },
                    { title: 'SINEACE',         sub: 'Acreditación empleabilidad',     c: COLORS.green, btn: 'Generar PDF', pri: true },
                    { title: 'Reporte Decano',  sub: 'Dashboard ejecutivo',            c: COLORS.amber, btn: 'Generar XLSX', pri: false },
                    { title: 'Datos abiertos',  sub: 'Exportar dataset',               c: COLORS.purple, btn: 'Descargar CSV', pri: false },
                  ].map(item => (
                    <div key={item.title} style={S.suneduI(item.c)}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#718096', marginBottom: 10 }}>{item.sub}</div>
                      <button style={item.pri ? S.btnPri : S.btnSm}>{item.btn}</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Estado de encuestas</span></div>
                {[
                  { t: 'Seguimiento 1 año — 2024',  r: 34, e: 45, badge: 'warn', p: '75.6%' },
                  { t: 'Seguimiento 3 años — 2024', r: 28, e: 30, badge: 'ok',   p: '93.3%' },
                  { t: 'Seguimiento 5 años — 2023', r: 22, e: 22, badge: 'ok',   p: '100%' },
                ].map((enc,i) => (
                  <div key={i} style={{ ...S.encRow, ...(i === 2 ? { borderBottom: 'none' } : {}) }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{enc.t}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Respuestas: {enc.r} / {enc.e}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge type={enc.badge}>{enc.p}</Badge>
                      <button style={S.btnSm}>Ver</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid rgba(0,0,0,.06)' }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>Próximo envío automático</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Encuesta 1 año — Generación 2023</div>
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>15 de abril 2026 — 42 destinatarios</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: MAPA ── */}
        {activeTab === 'mapa' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Mapa laboral del Perú</div>
              <div style={S.sectionS}>Distribución geográfica de egresados por región y sector empresarial</div>
            </div>
            <div style={S.row3}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Concentración por región</span></div>
                {/* Mapa SVG simplificado de regiones */}
                <svg viewBox="0 0 300 420" style={{ width: '100%', maxHeight: 360 }}>
                  {[
                    { x:100,y:20,w:100,h:45,fill:'#e6f1fb',tc:'#185fa5',name:'Tumbes',n:3 },
                    { x:75,y:70,w:85,h:52,fill:'#b5d4f4',tc:'#0c447c',name:'Piura',n:8 },
                    { x:112,y:70,w:88,h:52,fill:'#b5d4f4',tc:'#0c447c',name:'Cajamarca',n:5 },
                    { x:88,y:128,w:104,h:62,fill:'#378add',tc:'#042c53',name:'La Libertad',n:147 },
                    { x:78,y:196,w:88,h:52,fill:'#85b7eb',tc:'#042c53',name:'Áncash',n:12 },
                    { x:98,y:254,w:104,h:58,fill:'#85b7eb',tc:'#042c53',name:'Lima',n:89 },
                    { x:94,y:318,w:112,h:50,fill:'#e6f1fb',tc:'#185fa5',name:'Arequipa',n:23 },
                    { x:98,y:374,w:104,h:36,fill:'#f7f9fc',tc:'#378add',name:'Otras regiones',n:20 },
                  ].map((r) => (
                    <g key={r.name}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill={r.fill} stroke="rgba(255,255,255,.6)" strokeWidth={1} />
                      <text x={r.x+r.w/2} y={r.y+r.h/2-6} textAnchor="middle" fontSize={10} fill={r.tc} fontWeight={r.n>50?'500':'400'}>{r.name}</text>
                      <text x={r.x+r.w/2} y={r.y+r.h/2+8} textAnchor="middle" fontSize={9} fill={r.tc}>{r.n} egresados</text>
                    </g>
                  ))}
                </svg>
              </div>
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={S.cardH}><span style={S.cardT}>Top regiones</span></div>
                  <div style={S.mapGrid}>
                    {[['La Libertad',147],['Lima',89],['Arequipa',23],['Áncash',12],['Piura',8],['Exterior',6]].map(([r,n]) => (
                      <div key={r} style={S.regCard}>
                        <span style={{ fontSize: 12, color: '#718096' }}>{r}</span>
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardH}><span style={S.cardT}>Sector por región</span></div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Región</th><th style={S.th}>Sector líder</th><th style={S.th}>%</th></tr></thead>
                    <tbody>
                      {[['La Libertad','Tecnología','38%'],['Lima','Finanzas','41%'],['Arequipa','Minería','55%']].map(([r,s,p]) => (
                        <tr key={r}><td style={S.td}>{r}</td><td style={S.td}>{s}</td><td style={S.td}><strong>{p}</strong></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
