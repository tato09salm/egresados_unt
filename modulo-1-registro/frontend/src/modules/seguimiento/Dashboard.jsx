import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_seguimiento';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav:  { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { maxWidth:1100, margin:'0 auto', padding:'28px 16px' },
  kpis: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 },
  kpi:  (c) => ({ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', borderLeft:`4px solid ${c}` }),
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  h3:   { fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 },
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  encuestaBadge: { display:'inline-block', padding:'4px 12px', background:'#fffbeb', border:'1px solid #f6ad55', color:'#744210', borderRadius:20, fontSize:12, fontWeight:600 },
};

// Mini bar chart SVG
function BarChart({ data, color = '#276749', label = 'value' }) {
  if (!data?.length) return <div style={{ color:'#a0aec0', fontSize:13, padding:20 }}>Sin datos disponibles</div>;
  const max = Math.max(...data.map(d => parseFloat(d[label]) || 0));
  const W = 600, H = 180, PAD = 40, barW = Math.max(20, (W - PAD*2) / data.length - 8);

  return (
    <svg viewBox={`0 0 ${W} ${H+40}`} style={{ width:'100%', maxWidth:W }}>
      {data.map((d, i) => {
        const x = PAD + i * ((W - PAD*2) / data.length) + 4;
        const val = parseFloat(d[label]) || 0;
        const h = max > 0 ? (val / max) * H : 0;
        const y = H - h + 10;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill={color} rx={3} opacity={0.85} />
            <text x={x + barW/2} y={y-4} textAnchor="middle" fontSize={10} fill="#4a5568">{val.toFixed(1)}</text>
            <text x={x + barW/2} y={H+28} textAnchor="middle" fontSize={9} fill="#718096">{d.anio || d.escuela?.substring(0,10)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const [kpis, setKpis]         = useState(null);
  const [tendencias, setTend]   = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [encPend, setEncPend]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/tendencias'),
      api.get('/api/encuestas/pendientes').catch(() => ({ data:{ data:[] } })),
    ]).then(([dash, enc]) => {
      setKpis(dash.data.data?.kpis);
      setTend(dash.data.data?.tendencias || []);
      setEncPend(enc.data.data || []);
    }).catch(() => navigate('/login'))
    .finally(() => setLoading(false));

    // Indicadores por escuela (primera escuela del sistema)
    api.get('/api/dashboard/escuela/b1000000-0000-0000-0000-000000000001')
      .then(r => setEscuelas(r.data.data?.indicadores || []))
      .catch(() => {});
  }, []);

  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  if (loading) return <div style={{ textAlign:'center', padding:80, color:'#718096' }}>Cargando dashboard...</div>;

  return (
    <div style={s.page}>
      <div style={s.body}>


        {/* Encuestas pendientes */}
        {encPend.length > 0 && (
          <div style={{ background:'#fffbeb', border:'1px solid #f6ad55', borderRadius:10, padding:16, marginBottom:24 }}>
            <div style={{ fontWeight:700, color:'#744210', marginBottom:10 }}>📋 Tienes encuestas pendientes</div>
            {encPend.map(e => (
              <div key={e.id_encuesta} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:14, color:'#744210' }}>{e.nombre}</span>
                <button style={{ padding:'6px 16px', background:'#744210', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:600 }}
                  onClick={() => navigate(`/encuesta/${e.id_encuesta}`)}>Responder →</button>
              </div>
            ))}
          </div>
        )}

        {/* KPIs */}
        <div style={s.kpis}>
          {[
            { label:'Total Egresados', value: kpis?.total_egresados || 0, unit:'', color:'#2d6a9f', icon:'🎓' },
            { label:'Empleados', value: kpis?.empleados || 0, unit:'', color:'#276749', icon:'💼' },
            { label:'Ofertas Activas', value: kpis?.ofertas_activas || 0, unit:'', color:'#744210', icon:'📋' },
            { label:'Postulaciones (30d)', value: kpis?.postulaciones_mes || 0, unit:'', color:'#553c9a', icon:'📤' },
          ].map(k => (
            <div key={k.label} style={s.kpi(k.color)}>
              <div style={{ fontSize:28, marginBottom:8 }}>{k.icon}</div>
              <div style={{ fontSize:26, fontWeight:700, color:k.color }}>{parseInt(k.value).toLocaleString()}{k.unit}</div>
              <div style={{ fontSize:12, color:'#718096', marginTop:4 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Gráfica de tendencias */}
        <div style={s.card}>
          <h3 style={s.h3}>📈 Tasa de Empleabilidad por Año (%)</h3>
          <BarChart data={tendencias} color="#276749" label="tasa_empleabilidad" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={s.card}>
            <h3 style={s.h3}>💰 Salario Promedio por Año (S/.)</h3>
            <BarChart data={tendencias} color="#2d6a9f" label="salario_promedio" />
          </div>
          <div style={s.card}>
            <h3 style={s.h3}>⏱ Tiempo Promedio para Conseguir Empleo (meses)</h3>
            <BarChart data={tendencias} color="#744210" label="tiempo_promedio" />
          </div>
        </div>

        {/* Tabla de indicadores por escuela */}
        {escuelas.length > 0 && (
          <div style={s.card}>
            <h3 style={s.h3}>📊 Indicadores — Ingeniería Informática</h3>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f7fafc' }}>
                  {['Año','Mes','Empleabilidad','Salario Prom.','Tiempo Prom.','Sector'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:600, color:'#4a5568', borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {escuelas.slice(0,8).map((ind,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f7fafc' }}>
                    <td style={{ padding:'8px 12px' }}>{ind.anio}</td>
                    <td style={{ padding:'8px 12px' }}>{ind.mes || '—'}</td>
                    <td style={{ padding:'8px 12px', color:'#276749', fontWeight:600 }}>{ind.tasa_empleabilidad}%</td>
                    <td style={{ padding:'8px 12px' }}>S/. {ind.salario_promedio ? parseInt(ind.salario_promedio).toLocaleString() : '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{ind.tiempo_promedio_empleo ? `${ind.tiempo_promedio_empleo} meses` : '—'}</td>
                    <td style={{ padding:'8px 12px' }}>{ind.sector_predominante || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
