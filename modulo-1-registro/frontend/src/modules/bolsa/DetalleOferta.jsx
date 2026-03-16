import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav:  { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  back: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  body: { maxWidth:820, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:28, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  h2:   { fontSize:22, fontWeight:700, color:'#1a365d', marginBottom:8 },
  badge:(c)=>({ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c }),
  tag:  { display:'inline-block', padding:'4px 12px', background:'#ebf8ff', color:'#2b6cb0', borderRadius:20, fontSize:12, fontWeight:500, margin:3 },
  btn:  { padding:'12px 28px', background:'#276749', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer' },
  textarea: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, resize:'vertical', minHeight:100, outline:'none' },
  err: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px', marginTop:10, fontSize:13 },
  ok:  { background:'#f0fff4', border:'1px solid #9ae6b4', color:'#276749', borderRadius:8, padding:'10px', marginTop:10, fontSize:13 },
};

export default function DetalleOferta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oferta, setOferta] = useState(null);
  const [carta, setCarta] = useState('');
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  useEffect(() => {
    api.get(`/api/ofertas/${id}`).then(r => setOferta(r.data.data)).catch(() => navigate('/bolsa'));
  }, [id]);

  const postular = async () => {
    setLoading(true); setMsg({ type:'', text:'' });
    try {
      const r = await api.post(`/api/ofertas/${id}/postular`, { carta_presentacion: carta });
      setMsg({ type:'ok', text: `¡Postulación enviada! Compatibilidad: ${r.data.data.puntaje_match}%` });
    } catch(e) {
      setMsg({ type:'err', text: e.response?.data?.message || 'Error al postular' });
    }
    setLoading(false);
  };

  if (!oferta) return <div style={{ textAlign:'center', padding:80 }}>Cargando...</div>;

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate('/bolsa')}>← Volver</button>
        <span style={{ fontWeight:700, fontSize:16 }}>💼 SGE-UNT Bolsa Laboral</span>
      </nav>
      <div style={s.body}>
        <div style={s.card}>
          <h2 style={s.h2}>{oferta.titulo}</h2>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
            <span style={s.badge('#276749')}>{oferta.modalidad}</span>
            <span style={s.badge('#2d6a9f')}>{oferta.tipo_contrato?.replace('_',' ')}</span>
            {oferta.verificada && <span style={s.badge('#744210')}>✓ Empresa Verificada</span>}
            {Number.isFinite(Number(oferta.puntaje_match)) && <span style={s.badge('#2b6cb0')}>🎯 {Math.round(Number(oferta.puntaje_match))}% compatibilidad</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div><div style={{ fontSize:11, fontWeight:600, color:'#a0aec0' }}>EMPRESA</div><div style={{ fontSize:14, fontWeight:600 }}>{oferta.empresa}</div><div style={{ fontSize:12, color:'#718096' }}>{oferta.sector}</div></div>
            <div><div style={{ fontSize:11, fontWeight:600, color:'#a0aec0' }}>SALARIO</div><div style={{ fontSize:16, fontWeight:700, color:'#276749' }}>{oferta.salario_min && oferta.salario_max ? `S/. ${parseInt(oferta.salario_min).toLocaleString()} – ${parseInt(oferta.salario_max).toLocaleString()}` : 'A negociar'}</div></div>
            <div><div style={{ fontSize:11, fontWeight:600, color:'#a0aec0' }}>VACANTES</div><div style={{ fontSize:14 }}>{oferta.vacantes}</div></div>
            <div><div style={{ fontSize:11, fontWeight:600, color:'#a0aec0' }}>CIERRE</div><div style={{ fontSize:14 }}>{oferta.fecha_cierre ? new Date(oferta.fecha_cierre).toLocaleDateString('es-PE') : 'Sin fecha límite'}</div></div>
          </div>
          <div style={{ borderTop:'1px solid #f0f4f8', paddingTop:16 }}>
            <div style={{ fontWeight:600, color:'#1a365d', marginBottom:8 }}>Descripción</div>
            <p style={{ fontSize:14, color:'#4a5568', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{oferta.descripcion}</p>
          </div>
          {oferta.requisitos && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontWeight:600, color:'#1a365d', marginBottom:8 }}>Requisitos</div>
              <p style={{ fontSize:14, color:'#4a5568', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{oferta.requisitos}</p>
            </div>
          )}
          {oferta.habilidades?.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontWeight:600, color:'#1a365d', marginBottom:8 }}>Habilidades requeridas</div>
              <div>{oferta.habilidades.map((h,i) => <span key={i} style={{ ...s.tag, ...(h.requerida?{}:{ background:'#f7fafc', color:'#718096' }) }}>{h.nombre}{h.requerida?' *':''}</span>)}</div>
            </div>
          )}
        </div>

        {user.rol === 'egresado' && (
          <div style={s.card}>
            <div style={{ fontWeight:700, color:'#1a365d', marginBottom:12 }}>Carta de Presentación (opcional)</div>
            <textarea style={s.textarea} placeholder="Cuéntanos por qué eres el candidato ideal para esta posición..." value={carta} onChange={e=>setCarta(e.target.value)} />
            {msg.text && <div style={msg.type==='ok' ? s.ok : s.err}>{msg.text}</div>}
            {msg.type !== 'ok' && (
              <button style={{ ...s.btn, marginTop:16 }} onClick={postular} disabled={loading}>
                {loading ? 'Enviando...' : '📤 Postular a esta oferta'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
