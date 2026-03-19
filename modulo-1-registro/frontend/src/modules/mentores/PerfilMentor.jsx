import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8', fontFamily:'system-ui,sans-serif' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  back: { background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  body: { maxWidth:860, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:28, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  avatar: { width:90, height:90, borderRadius:'50%', background:'linear-gradient(135deg,#553c9a,#805ad5)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, fontWeight:700, overflow:'hidden', flexShrink:0 },
  tag:  { display:'inline-block', padding:'4px 12px', background:'#f3e8ff', color:'#553c9a', borderRadius:20, fontSize:12, margin:3 },
  btn:  { padding:'12px 28px', background:'#553c9a', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  btnOut: { padding:'12px 28px', background:'transparent', border:'1.5px solid #553c9a', color:'#553c9a', borderRadius:8, fontSize:13, cursor:'pointer' },
  textarea: { width:'100%', padding:'12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, resize:'vertical', minHeight:100, outline:'none', boxSizing:'border-box' },
  ok:  { background:'#f0fff4', border:'1px solid #9ae6b4', color:'#276749', borderRadius:8, padding:'12px', fontSize:13, marginTop:12 },
  err: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'12px', fontSize:13, marginTop:12 },
  statCard: { background:'#f7fafc', borderRadius:10, padding:'14px 18px', textAlign:'center', border:'1px solid #e2e8f0' },
};

function Stars({ val }) {
  return <span>{[1,2,3,4,5].map(i=><span key={i} style={{ color:i<=Math.round(val||0)?'#f6ad55':'#e2e8f0', fontSize:20 }}>★</span>)}</span>;
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
    api.get(`/api/mentores/${id}`)
      .then(r => setMentor(r.data.data))
      .catch(() => navigate('/mentores'));
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

  const exportarPDF = () => {
    if (!mentor) return;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(26,54,93);
    doc.text(`Perfil de Mentor: ${mentor.nombres} ${mentor.apellidos}`, 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`SGE-UNT · Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);

    autoTable(doc, {
      startY: 36, theme: 'grid',
      head: [['Campo', 'Valor']],
      body: [
        ['Nombre', `${mentor.nombres} ${mentor.apellidos}`],
        ['Cargo', mentor.cargo_actual || '-'],
        ['Empresa', mentor.empresa_actual || '-'],
        ['Escuela', mentor.escuela || '-'],
        ['Facultad', mentor.facultad || '-'],
        ['Área de expertise', mentor.area_expertise || '-'],
        ['Modalidad', mentor.modalidad || '-'],
        ['Disponibilidad', `${mentor.disponibilidad_horas} h/semana`],
        ['Calificación', mentor.calificacion_promedio ? `${parseFloat(mentor.calificacion_promedio).toFixed(1)}/5` : 'Sin calificaciones'],
        ['Email', mentor.email || '-'],
        ['Teléfono', mentor.telefono || '-'],
        ['Especialidades', (mentor.especialidades||[]).join(', ') || '-'],
      ],
      headStyles: { fillColor:[85,60,154] },
    });

    const stats = mentor.estadisticas;
    if (stats) {
      const y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13); doc.setTextColor(26,54,93);
      doc.text('Estadísticas', 14, y);
      autoTable(doc, {
      startY: y+4, theme: 'grid',
      head: [['Métrica','Valor']],
      body: [
        ['Mentorados activos', stats.mentorados_activos || 0],
        ['Sesiones realizadas', stats.sesiones_realizadas || 0],
        ['Total evaluaciones', stats.total_evaluaciones || 0],
        ['Tasa de aceptación', stats.tasa_aceptacion ? `${stats.tasa_aceptacion}%` : '-'],
        ['Tiempo de respuesta', stats.tiempo_respuesta_horas ? `${stats.tiempo_respuesta_horas}h` : '-'],
      ],
      headStyles: { fillColor:[85,60,154] },
    });
    }

    if (mentor.evaluaciones?.length) {
      const y2 = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(13); doc.setTextColor(26,54,93);
      doc.text('Evaluaciones recientes', 14, y2);
      autoTable(doc, {
        startY: y2+4, theme: 'grid',
        head: [['Evaluador','Calificación','Comentario']],
        body: mentor.evaluaciones.map(ev => [
          `${ev.nombres} ${ev.apellidos}`,
          `${ev.calificacion}/5`,
          ev.comentario || '-',
        ]),
        headStyles: { fillColor:[85,60,154] },
      });
    }
    doc.save(`perfil_mentor_${mentor.nombres}_${mentor.apellidos}.pdf`);
  };

  if (!mentor) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
      <div style={{ textAlign:'center', color:'#718096' }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>Cargando perfil...
      </div>
    </div>
  );

  const stats = mentor.estadisticas || {};

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate(-1)}>← Regresar</button>
        <span style={{ fontWeight:700, fontSize:16, flex:1, textAlign:'center' }}>🤝 Perfil de Mentor</span>
        <button style={{ ...s.back, borderColor:'rgba(255,255,255,.5)' }} onClick={exportarPDF}>📄 Exportar PDF</button>
      </nav>

      <div style={s.body}>
        {/* Header */}
        <div style={s.card}>
          <div style={{ display:'flex', gap:22, alignItems:'flex-start', marginBottom:20, flexWrap:'wrap' }}>
            <div style={s.avatar}>
              {mentor.foto_url
                ? <img src={mentor.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <>{mentor.nombres?.charAt(0)}{mentor.apellidos?.charAt(0)}</>}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <h2 style={{ fontSize:24, fontWeight:700, color:'#1a365d', margin:0 }}>{mentor.nombres} {mentor.apellidos}</h2>
              <div style={{ color:'#553c9a', fontWeight:600, fontSize:15, marginTop:4 }}>{mentor.cargo_actual}</div>
              <div style={{ color:'#718096', fontSize:14, marginTop:2 }}>🏢 {mentor.empresa_actual}</div>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <Stars val={mentor.calificacion_promedio} />
                <span style={{ fontSize:13, color:'#718096' }}>
                  {mentor.calificacion_promedio ? `${parseFloat(mentor.calificacion_promedio).toFixed(1)}/5` : 'Sin calificaciones'}
                  {stats.total_evaluaciones > 0 && ` (${stats.total_evaluaciones} evaluaciones)`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:14, marginBottom:18 }}>
            {[
              ['Escuela', mentor.escuela, '📚'],
              ['Facultad', mentor.facultad, '🏛'],
              ['Área de expertise', mentor.area_expertise, '💡'],
              ['Disponibilidad', `${mentor.disponibilidad_horas}h/semana`, '🕐'],
              ['Modalidad', mentor.modalidad, '📡'],
              mentor.email && ['Email', mentor.email, '📧'],
              mentor.telefono && ['Teléfono', mentor.telefono, '📱'],
            ].filter(Boolean).filter(([,v])=>v).map(([l,v,ic]) => (
              <div key={l} style={{ background:'#f7fafc', borderRadius:8, padding:'10px 14px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#a0aec0', textTransform:'uppercase', marginBottom:4 }}>{ic} {l}</div>
                <div style={{ fontSize:13, color:'#2d3748', fontWeight:500 }}>{v}</div>
              </div>
            ))}
          </div>

          {mentor.bio && (
            <div style={{ background:'#f3e8ff', borderRadius:8, padding:'14px 18px', marginBottom:16, border:'1px solid #e9d8fd' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#553c9a', textTransform:'uppercase', marginBottom:6 }}>Acerca del mentor</div>
              <p style={{ margin:0, fontSize:13, color:'#4a5568', lineHeight:1.6 }}>{mentor.bio}</p>
            </div>
          )}

          {mentor.especialidades?.length > 0 && (
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:8 }}>🏷 Especialidades</div>
              {mentor.especialidades.map((e,i) => <span key={i} style={s.tag}>{e}</span>)}
            </div>
          )}
        </div>

        {/* Indicadores Empresariales */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', margin:0 }}>📊 Performance & Engagement</h3>
            <span style={{ fontSize:11, color:'#718096', background:'#f7fafc', padding:'4px 10px', borderRadius:20, border:'1px solid #edf2f7' }}>Actualizado hoy</span>
          </div>
          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:24 }}>
            {/* Tasa de Aceptación */}
            <div style={{ background:'#fff', padding:16, borderRadius:12, border:'1px solid #edf2f7' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>📈</div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#4a5568' }}>Tasa de Aceptación</span>
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:'#553c9a' }}>{stats.tasa_aceptacion || 0}%</span>
              </div>
              <div style={{ width:'100%', height:6, background:'#f7fafc', borderRadius:10, overflow:'hidden', border:'1px solid #edf2f7' }}>
                <div style={{ width:`${stats.tasa_aceptacion || 0}%`, height:'100%', background:'linear-gradient(90deg, #9f7aea, #553c9a)', borderRadius:10 }} />
              </div>
              <p style={{ fontSize:11, color:'#718096', marginTop:10, lineHeight:1.4 }}>Indica la receptividad del mentor hacia nuevas solicitudes de mentoría.</p>
            </div>

            {/* Tiempo de Respuesta */}
            <div style={{ background:'#fff', padding:16, borderRadius:12, border:'1px solid #edf2f7' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'#ebf8ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>⚡</div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#4a5568' }}>Agilidad de Respuesta</span>
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:'#2b6cb0' }}>{stats.tiempo_respuesta_horas || '-'}h</span>
              </div>
              <div style={{ width:'100%', height:6, background:'#f7fafc', borderRadius:10, overflow:'hidden', border:'1px solid #edf2f7' }}>
                <div style={{ 
                  width:`${Math.max(10, 100 - (stats.tiempo_respuesta_horas ? (stats.tiempo_respuesta_horas/48)*100 : 0))}%`, 
                  height:'100%', 
                  background:'linear-gradient(90deg, #4299e1, #2b6cb0)', 
                  borderRadius:10 
                }} />
              </div>
              <p style={{ fontSize:11, color:'#718096', marginTop:10, lineHeight:1.4 }}>Tiempo promedio en procesar solicitudes (Referencia: 48 horas).</p>
            </div>

            {/* Experiencia en Sesiones */}
            <div style={{ background:'#fff', padding:16, borderRadius:12, border:'1px solid #edf2f7' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:'#f0fff4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏆</div>
                  <span style={{ fontSize:13, fontWeight:600, color:'#4a5568' }}>Sesiones Ejecutadas</span>
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:'#276749' }}>{stats.sesiones_realizadas || 0}</span>
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ 
                    flex:1, 
                    height:6, 
                    background: i < Math.min(10, Math.ceil((stats.sesiones_realizadas || 0)/5)) ? '#276749' : '#f0f4f8', 
                    borderRadius:10 
                  }} />
                ))}
              </div>
              <p style={{ fontSize:11, color:'#718096', marginTop:10, lineHeight:1.4 }}>Volumen de mentorías completadas satisfactoriamente en la plataforma.</p>
            </div>
          </div>

          <div style={{ display:'flex', gap:24, marginTop:24, padding:'16px 0', borderTop:'1px dashed #edf2f7' }}>
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#a0aec0', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Mentorados</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2d3748' }}>{stats.mentorados_activos || 0} <span style={{ fontSize:12, fontWeight:400, color:'#718096' }}>Activos</span></div>
            </div>
            <div style={{ width:1, background:'#edf2f7' }} />
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#a0aec0', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Feedback</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#2d3748' }}>{stats.total_evaluaciones || 0} <span style={{ fontSize:12, fontWeight:400, color:'#718096' }}>Reseñas</span></div>
            </div>
            <div style={{ width:1, background:'#edf2f7' }} />
            <div style={{ flex:1, textAlign:'center' }}>
              <div style={{ fontSize:11, color:'#a0aec0', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Score Global</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#d69e2e' }}>{stats.calificacion_real || '-'} <span style={{ fontSize:12, fontWeight:400, color:'#718096' }}>/ 5.0</span></div>
            </div>
          </div>
        </div>

        {/* Evaluaciones */}
        {mentor.evaluaciones?.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 }}>💬 Evaluaciones de Mentorados</h3>
            {mentor.evaluaciones.map((ev, i) => (
              <div key={i} style={{ borderBottom:'1px solid #f7fafc', paddingBottom:14, marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:'#2d3748' }}>{ev.nombres} {ev.apellidos}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Stars val={ev.calificacion} />
                    {ev.fecha && <span style={{ fontSize:11, color:'#a0aec0' }}>{new Date(ev.fecha).toLocaleDateString('es-PE')}</span>}
                  </div>
                </div>
                {ev.comentario && <p style={{ fontSize:13, color:'#4a5568', marginTop:8, fontStyle:'italic', background:'#f7fafc', padding:'8px 12px', borderRadius:6 }}>"{ev.comentario}"</p>}
              </div>
            ))}
          </div>
        )}

        {/* Solicitar mentoría//comentario */}
        {user.rol === 'egresado' && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:12 }}>🤝 Solicitar Mentoría</h3>
            <p style={{ fontSize:13, color:'#718096', marginBottom:14, lineHeight:1.6 }}>
              Describe tu objetivo de mentoría: qué quieres aprender o lograr con la ayuda de {mentor.nombres}.
            </p>
            <textarea style={s.textarea} value={objetivo} onChange={e=>setObjetivo(e.target.value)}
              placeholder="Ej: Quiero desarrollar habilidades en machine learning para aplicar a proyectos reales en la industria..." />
            <div style={{ fontSize:12, color:'#a0aec0', marginTop:4, textAlign:'right' }}>{objetivo.length} caracteres</div>
            {msg.text && <div style={msg.type==='ok' ? s.ok : s.err}>{msg.text}</div>}
            {msg.type !== 'ok' && (
              <div style={{ display:'flex', gap:10, marginTop:16, flexWrap:'wrap' }}>
                <button style={s.btn} onClick={solicitar} disabled={loading}>
                  {loading ? '⏳ Enviando...' : '🤝 Enviar Solicitud de Mentoría'}
                </button>
                <button style={s.btnOut} onClick={() => navigate('/mentores')}>Ver más mentores</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
