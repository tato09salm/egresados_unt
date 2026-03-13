import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  body: { maxWidth:800, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  badge: c => ({ display:'inline-block', padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:600, background:c+'22', color:c }),
  btn: { padding:'10px 22px', background:'#553c9a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  input: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none' },
  back: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
};

const estadoColor = { pendiente:'#d69e2e', aceptada:'#276749', rechazada:'#e53e3e', expirada:'#a0aec0' };

function Stars({ val, onSet }) {
  const [hover, setHover] = useState(0);
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ color: i <= (hover || val || 0) ? '#f6ad55' : '#e2e8f0', fontSize:32, cursor:onSet?'pointer':'default' }}
          onMouseEnter={() => onSet && setHover(i)}
          onMouseLeave={() => onSet && setHover(0)}
          onClick={() => onSet && onSet(i)}>★</span>
      ))}
    </span>
  );
}

export default function MiMentoria() {
  const [mentoria, setMentoria] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [evalData, setEvalData] = useState({ sesionId:'', cal:0, comentario:'' });
  const [loading, setLoading]   = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/api/mentorado/mi-mentor'),
      api.get('/api/sesiones'),
    ]).then(([m, s]) => {
      setMentoria(m.data.data);
      setSesiones(s.data.data || []);
    }).catch(() => navigate('/login'))
    .finally(() => setLoading(false));
  }, []);

  const evaluar = async () => {
    if (!evalData.cal) return;
    try {
      await api.post(`/api/sesiones/${evalData.sesionId}/evaluar`, { calificacion: evalData.cal, comentario: evalData.comentario });
      setEvalData({ sesionId:'', cal:0, comentario:'' });
      const r = await api.get('/api/sesiones');
      setSesiones(r.data.data || []);
      alert('Evaluación enviada');
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
  };

  if (loading) return <div style={{ textAlign:'center', padding:80 }}>Cargando...</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate('/mentores')}>← Directorio</button>
        <span style={{ fontWeight:700, fontSize:16 }}>📚 Mi Mentoría</span>
      </nav>
      <div style={s.body}>

        {/* Estado de solicitud actual */}
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16 }}>Estado de Mentoría Actual</h3>
          {mentoria ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, color:'#1a365d' }}>{mentoria.nombres} {mentoria.apellidos}</div>
                  <div style={{ color:'#553c9a', fontSize:14 }}>{mentoria.cargo_actual} — {mentoria.empresa_actual}</div>
                  <div style={{ color:'#718096', fontSize:13, marginTop:6 }}>Objetivo: {mentoria.objetivo}</div>
                </div>
                <span style={s.badge(estadoColor[mentoria.estado] || '#718096')}>{mentoria.estado}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:24, color:'#a0aec0' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🤝</div>
              <div>No tienes una mentoría activa. Explora el directorio para conectarte con un mentor.</div>
              <button style={{ ...s.btn, marginTop:16 }} onClick={() => navigate('/mentores')}>Buscar Mentor →</button>
            </div>
          )}
        </div>

        {/* Sesiones */}
        {sesiones.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16 }}>Historial de Sesiones</h3>
            {sesiones.map(se => (
              <div key={se.id_sesion} style={{ borderBottom:'1px solid #f0f4f8', paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:600, color:'#2d3748' }}>{new Date(se.fecha_hora).toLocaleString('es-PE')}</div>
                    <div style={{ fontSize:13, color:'#718096' }}>{se.modalidad} · {se.duracion_min} min</div>
                    {se.enlace_virtual && <a href={se.enlace_virtual} target="_blank" style={{ fontSize:12, color:'#553c9a' }}>🔗 Enlace virtual</a>}
                  </div>
                  <span style={s.badge(se.realizada ? '#276749' : '#d69e2e')}>{se.realizada ? 'Realizada' : 'Pendiente'}</span>
                </div>
                {se.notas_mentor && <div style={{ marginTop:8, fontSize:12, color:'#4a5568', background:'#f7fafc', padding:'8px 12px', borderRadius:6 }}>Notas del mentor: {se.notas_mentor}</div>}
                {/* Formulario de evaluación */}
                {se.realizada && evalData.sesionId !== se.id_sesion && (
                  <button style={{ ...s.btn, marginTop:10, fontSize:12, padding:'6px 14px', background:'#f3e8ff', color:'#553c9a' }}
                    onClick={() => setEvalData({ sesionId:se.id_sesion, cal:0, comentario:'' })}>
                    ⭐ Evaluar sesión
                  </button>
                )}
                {evalData.sesionId === se.id_sesion && (
                  <div style={{ marginTop:12, background:'#f3e8ff', borderRadius:8, padding:14 }}>
                    <div style={{ fontWeight:600, color:'#553c9a', marginBottom:8 }}>Califica esta sesión</div>
                    <Stars val={evalData.cal} onSet={n => setEvalData({ ...evalData, cal:n })} />
                    <textarea style={{ ...s.input, marginTop:10, resize:'vertical', minHeight:60 }} placeholder="Comentario opcional..."
                      value={evalData.comentario} onChange={e => setEvalData({ ...evalData, comentario:e.target.value })} />
                    <div style={{ display:'flex', gap:8, marginTop:10 }}>
                      <button style={s.btn} onClick={evaluar} disabled={!evalData.cal}>Enviar evaluación</button>
                      <button style={{ ...s.btn, background:'#e2e8f0', color:'#4a5568' }} onClick={() => setEvalData({ sesionId:'', cal:0, comentario:'' })}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
