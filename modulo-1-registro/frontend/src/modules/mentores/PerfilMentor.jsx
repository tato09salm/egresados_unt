import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  body: { maxWidth:820, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:28, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  avatar: { width:80, height:80, borderRadius:'50%', background:'#553c9a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:700 },
  tag:  { display:'inline-block', padding:'4px 12px', background:'#f3e8ff', color:'#553c9a', borderRadius:20, fontSize:12, margin:3 },
  btn:  { padding:'12px 28px', background:'#553c9a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  textarea: { width:'100%', padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, resize:'vertical', minHeight:100, outline:'none' },
  ok:  { background:'#f3e8ff', border:'1px solid #b794f4', color:'#553c9a', borderRadius:8, padding:'12px', fontSize:13, marginTop:12 },
  err: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'12px', fontSize:13, marginTop:12 },
};

function Stars({ val }) {
  return <span>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=Math.round(val||0)?'#f6ad55':'#e2e8f0', fontSize:18 }}>★</span>)}</span>;
}

export default function PerfilMentor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mentor, setMentor] = useState(null);
  const [objetivo, setObjetivo] = useState('');
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  useEffect(() => {
    api.get(`/api/mentores/${id}`).then(r => setMentor(r.data.data)).catch(() => navigate('/mentores'));
  }, [id]);

  const solicitar = async () => {
    if (!objetivo.trim()) return setMsg({ type:'err', text:'Por favor describe tu objetivo de mentoría' });
    setLoading(true); setMsg({ type:'', text:'' });
    try {
      await api.post('/api/mentoria/solicitar', { id_mentor: id, objetivo });
      setMsg({ type:'ok', text:'✓ Solicitud enviada exitosamente. El mentor te responderá en los próximos días.' });
      setObjetivo('');
    } catch(e) { setMsg({ type:'err', text: e.response?.data?.message || 'Error al enviar solicitud' }); }
    setLoading(false);
  };

  if (!mentor) return <div style={{ textAlign:'center', padding:80 }}>Cargando...</div>;

  return (
    <div style={s.page}>
      <div style={s.body}>
        {/* Header mentor */}
        <div style={s.card}>
          <div style={{ display:'flex', gap:20, alignItems:'flex-start', marginBottom:20 }}>
            <div style={s.avatar}>{mentor.nombres?.charAt(0)}{mentor.apellidos?.charAt(0)}</div>
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:22, fontWeight:700, color:'#1a365d' }}>{mentor.nombres} {mentor.apellidos}</h2>
              <div style={{ color:'#553c9a', fontWeight:600, fontSize:15 }}>{mentor.cargo_actual}</div>
              <div style={{ color:'#718096', fontSize:14 }}>🏢 {mentor.empresa_actual}</div>
              <div style={{ marginTop:8 }}><Stars val={mentor.calificacion_promedio} /> <span style={{ fontSize:13, color:'#718096' }}>({mentor.calificacion_promedio ? parseFloat(mentor.calificacion_promedio).toFixed(1) : 'Sin calificaciones'})</span></div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[['Escuela', mentor.escuela],['Facultad', mentor.facultad],['Área de expertise', mentor.area_expertise],['Disponibilidad', `${mentor.disponibilidad_horas}h/semana`],['Modalidad', mentor.modalidad]].map(([l,v]) => v && (
              <div key={l}><div style={{ fontSize:11, fontWeight:600, color:'#a0aec0', textTransform:'uppercase' }}>{l}</div><div style={{ fontSize:14, color:'#2d3748', marginTop:2 }}>{v}</div></div>
            ))}
          </div>
          {mentor.especialidades?.length > 0 && (
            <div style={{ marginTop:20 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:8 }}>Especialidades</div>
              {mentor.especialidades.map((e,i) => <span key={i} style={s.tag}>{e}</span>)}
            </div>
          )}
        </div>

        {/* Evaluaciones */}
        {mentor.evaluaciones?.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 }}>Evaluaciones de mentorados</h3>
            {mentor.evaluaciones.map((ev, i) => (
              <div key={i} style={{ borderBottom:'1px solid #f7fafc', paddingBottom:12, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:600, fontSize:13 }}>{ev.nombres} {ev.apellidos}</span>
                  <Stars val={ev.calificacion} />
                </div>
                {ev.comentario && <p style={{ fontSize:13, color:'#4a5568', marginTop:6 }}>{ev.comentario}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Solicitar mentoría */}
        {user.rol === 'egresado' && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:12 }}>Solicitar Mentoría</h3>
            <p style={{ fontSize:13, color:'#718096', marginBottom:14 }}>Describe tu objetivo de mentoría: qué quieres aprender o lograr con la ayuda de este mentor.</p>
            <textarea style={s.textarea} value={objetivo} onChange={e=>setObjetivo(e.target.value)}
              placeholder="Ej: Quiero desarrollar habilidades en machine learning para aplicar a proyectos reales en la industria..." />
            {msg.text && <div style={msg.type==='ok' ? s.ok : s.err}>{msg.text}</div>}
            {msg.type !== 'ok' && (
              <button style={{ ...s.btn, marginTop:16 }} onClick={solicitar} disabled={loading}>
                {loading ? 'Enviando...' : '🤝 Enviar Solicitud de Mentoría'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
