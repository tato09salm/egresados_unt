import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8', fontFamily:'system-ui,sans-serif' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  body: { maxWidth:820, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  badge: c => ({ display:'inline-block', padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600, background:c+'22', color:c }),
  btn: { padding:'10px 22px', background:'#553c9a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  btnSm: { padding:'7px 16px', background:'#553c9a', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 },
  input: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', boxSizing:'border-box' },
  back: { background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#fff', borderRadius:16, padding:32, width:'90%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
};

const estadoColor = { pendiente:'#d69e2e', aceptada:'#276749', rechazada:'#e53e3e', expirada:'#a0aec0' };

function Stars({ val, onSet }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display:'inline-flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ color: i <= (hover || val || 0) ? '#f6ad55' : '#e2e8f0', fontSize:36, cursor:onSet?'pointer':'default', lineHeight:1 }}
          onMouseEnter={() => onSet && setHover(i)}
          onMouseLeave={() => onSet && setHover(0)}
          onClick={() => onSet && onSet(i)}>★</span>
      ))}
    </span>
  );
}

function EvalModal({ sesion, onSend, onCancel }) {
  const [cal, setCal] = useState(0);
  const [comentario, setComentario] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const enviar = async () => {
    if (!cal) return setErr('Selecciona una calificación de 1 a 5 estrellas');
    setSending(true); setErr('');
    try {
      await onSend(sesion.id_sesion, cal, comentario);
    } catch(e) { setErr(e.response?.data?.message || 'Error al enviar evaluación'); setSending(false); }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h3 style={{ color:'#1a365d', marginBottom:8 }}>⭐ Evaluar Sesión</h3>
        <p style={{ color:'#718096', fontSize:13, marginBottom:20 }}>
          Sesión del {new Date(sesion.fecha_hora).toLocaleString('es-PE')} con {sesion.mentor_nombre} {sesion.mentor_apellido}
        </p>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <Stars val={cal} onSet={setCal} />
          <div style={{ fontSize:13, color:'#718096', marginTop:8 }}>
            {cal===0 && 'Haz clic en una estrella'}
            {cal===1 && '⭐ Muy malo'}
            {cal===2 && '⭐⭐ Malo'}
            {cal===3 && '⭐⭐⭐ Regular'}
            {cal===4 && '⭐⭐⭐⭐ Bueno'}
            {cal===5 && '⭐⭐⭐⭐⭐ Excelente'}
          </div>
        </div>
        <textarea
          style={{ ...s.input, minHeight:90, resize:'vertical' }}
          placeholder="Comentario opcional: ¿cómo fue la sesión? ¿qué aprendiste?"
          value={comentario} onChange={e => setComentario(e.target.value)} />
        {err && <div style={{ marginTop:10, background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:7, padding:'8px 12px', fontSize:13 }}>{err}</div>}
        <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'flex-end' }}>
          <button style={{ padding:'10px 18px', background:'#f7fafc', border:'1.5px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:13 }} onClick={onCancel}>Cancelar</button>
          <button style={{ ...s.btn, opacity: cal===0 ? .5:1 }} onClick={enviar} disabled={sending||!cal}>
            {sending ? 'Enviando...' : '✓ Enviar Evaluación'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MiMentoria() {
  const [mentoria, setMentoria] = useState(null);
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [evalModal, setEvalModal] = useState(null);
  const [evalOk, setEvalOk]     = useState('');
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const [m, ses] = await Promise.all([
        api.get('/api/mentorado/mi-mentor'),
        api.get('/api/sesiones'),
      ]);
      setMentoria(m.data.data);
      setSesiones(ses.data.data || []);
    } catch { navigate('/login'); }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const onEvalSend = async (id_sesion, calificacion, comentario) => {
    try {
      await api.post(`/api/sesiones/${id_sesion}/evaluar`, { calificacion, comentario });
      setEvalModal(null);
      setEvalOk('✓ Evaluación enviada exitosamente. ¡Gracias por tu feedback!');
      await cargar();
      setTimeout(() => setEvalOk(''), 5000);
    } catch (e) {
      alert(e.response?.data?.message || 'Error al enviar evaluación');
    }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(26,54,93);
    doc.text('Mi Mentoría - SGE UNT', 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);

    if (mentoria) {
      autoTable(doc, {
        startY:36, theme:'grid', head:[['Campo','Valor']],
        body:[
          ['Mentor', `${mentoria.nombres} ${mentoria.apellidos}`],
          ['Cargo', `${mentoria.cargo_actual} - ${mentoria.empresa_actual}`],
          ['Estado', mentoria.estado],
          ['Objetivo', mentoria.objetivo || '-'],
          ['Email mentor', mentoria.email || '-'],
          ['Calificación mentor', mentoria.calificacion_promedio ? `${parseFloat(mentoria.calificacion_promedio).toFixed(1)}/5` : 'Sin cal.'],
        ],
        headStyles:{ fillColor:[85,60,154] },
      });
    }

    if (sesiones.length) {
      const y2 = (doc.lastAutoTable?.finalY || 40) + 10;
      doc.setFontSize(13); doc.setTextColor(26,54,93);
      doc.text('Historial de Sesiones', 14, y2);
      autoTable(doc, {
        startY: y2+4, head:[['Fecha','Duración','Modalidad','Estado','Evaluada']],
        body: sesiones.map(se => [
          new Date(se.fecha_hora).toLocaleString('es-PE'),
          `${se.duracion_min} min`,
          se.modalidad,
          se.realizada ? 'Realizada':'Pendiente',
          se.ya_evaluada ? 'Sí':'No',
        ]),
        headStyles:{ fillColor:[85,60,154] },
      });
    }
    doc.save('mi_mentoria.pdf');
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4f8' }}>
      <div style={{ textAlign:'center', color:'#718096' }}><div style={{ fontSize:32 }}>⏳</div>Cargando...</div>
    </div>
  );

  const proximasSesiones = sesiones.filter(s => !s.realizada).sort((a,b) => new Date(a.fecha_hora)-new Date(b.fecha_hora));
  const historial = sesiones.filter(s => s.realizada);

  return (
    <div style={s.page}>
      {evalModal && <EvalModal sesion={evalModal} onSend={onEvalSend} onCancel={() => setEvalModal(null)} />}

      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate(-1)}>← Regresar</button>
        <span style={{ fontWeight:700, fontSize:16, flex:1, textAlign:'center' }}>📚 Mi Mentoría</span>
        <button style={{ ...s.back, borderColor:'rgba(255,255,255,.5)' }} onClick={exportarPDF}>📄 PDF</button>
        <button style={s.logoutBtn} onClick={() => navigate('/mentores')}>Directorio</button>
      </nav>

      <div style={s.body}>
        {evalOk && (
          <div style={{ background:'#f0fff4', border:'1px solid #9ae6b4', color:'#276749', borderRadius:10, padding:'14px 18px', marginBottom:16, fontSize:14, fontWeight:500 }}>
            {evalOk}
          </div>
        )}

        {/* Estado de mentoría actual */}
        <div style={s.card}>
          <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16 }}>Estado de Mentoría Actual</h3>
          {mentoria ? (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:18, color:'#1a365d' }}>{mentoria.nombres} {mentoria.apellidos}</div>
                  <div style={{ color:'#553c9a', fontSize:14, fontWeight:500, marginTop:2 }}>{mentoria.cargo_actual} — {mentoria.empresa_actual}</div>
                  {mentoria.email && <div style={{ fontSize:13, color:'#718096', marginTop:2 }}>📧 {mentoria.email}</div>}
                  <div style={{ fontSize:13, color:'#4a5568', marginTop:8, background:'#f7fafc', padding:'8px 12px', borderRadius:6 }}>
                    <strong>Objetivo:</strong> {mentoria.objetivo}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                  <span style={s.badge(estadoColor[mentoria.estado] || '#718096')}>{mentoria.estado}</span>
                  {mentoria.calificacion_promedio && (
                    <span style={{ fontSize:13, color:'#f6ad55' }}>⭐ {parseFloat(mentoria.calificacion_promedio).toFixed(1)}/5</span>
                  )}
                </div>
              </div>
              <div style={{ marginTop:16, display:'flex', gap:10, flexWrap:'wrap' }}>
                <button style={s.btnSm} onClick={() => navigate(`/mentores/${mentoria.id_mentor}`)}>Ver perfil del mentor →</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign:'center', padding:28, color:'#a0aec0' }}>
              <div style={{ fontSize:42, marginBottom:14 }}>🤝</div>
              <div style={{ fontSize:14, marginBottom:4 }}>No tienes una mentoría activa.</div>
              <div style={{ fontSize:13, marginBottom:18 }}>Explora el directorio para conectarte con un mentor.</div>
              <button style={s.btn} onClick={() => navigate('/mentores')}>Buscar Mentor →</button>
            </div>
          )}
        </div>

        {/* Próximas sesiones */}
        {proximasSesiones.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16 }}>📅 Próximas Sesiones ({proximasSesiones.length})</h3>
            {proximasSesiones.map(se => (
              <div key={se.id_sesion} style={{ borderBottom:'1px solid #f0f4f8', paddingBottom:14, marginBottom:14, display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontWeight:600, color:'#2d3748', fontSize:14 }}>📆 {new Date(se.fecha_hora).toLocaleString('es-PE')}</div>
                  <div style={{ fontSize:13, color:'#718096', marginTop:2 }}>📡 {se.modalidad} · ⏱ {se.duracion_min} min</div>
                  {se.enlace_virtual && <a href={se.enlace_virtual} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#553c9a', display:'block', marginTop:2 }}>🔗 Enlace de la sesión</a>}
                </div>
                <span style={s.badge('#d69e2e')}>Pendiente</span>
              </div>
            ))}
          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16 }}>📋 Historial de Sesiones ({historial.length})</h3>
            {historial.map(se => (
              <div key={se.id_sesion} style={{ borderBottom:'1px solid #f0f4f8', paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontWeight:600, color:'#2d3748', fontSize:14 }}>{new Date(se.fecha_hora).toLocaleString('es-PE')}</div>
                    <div style={{ fontSize:13, color:'#718096', marginTop:2 }}>📡 {se.modalidad} · ⏱ {se.duracion_min} min</div>
                    {se.notas_mentor && (
                      <div style={{ marginTop:8, fontSize:12, color:'#4a5568', background:'#f7fafc', padding:'8px 12px', borderRadius:6 }}>
                        📝 <strong>Notas del mentor:</strong> {se.notas_mentor}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                    <span style={s.badge('#276749')}>✅ Realizada</span>
                    {se.ya_evaluada
                      ? <span style={{ fontSize:12, color:'#276749', background:'#f0fff4', padding:'3px 8px', borderRadius:6, border:'1px solid #9ae6b4' }}>⭐ Ya evaluada</span>
                      : <button style={{ ...s.btnSm, background:'#f3e8ff', color:'#553c9a', border:'1px solid #d6bcfa' }} onClick={() => setEvalModal(se)}>⭐ Evaluar</button>
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sesiones.length === 0 && mentoria?.estado === 'aceptada' && (
          <div style={{ textAlign:'center', padding:40, color:'#a0aec0' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📅</div>
            Tu mentor agendará sesiones próximamente
          </div>
        )}
      </div>
    </div>
  );
}
