import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const ESTADOS = ['pendiente','revision','entrevista','aceptado','rechazado'];
const LABELS  = { pendiente:'Pendiente', revision:'Revisión', entrevista:'Entrevista', aceptado:'Aceptado', rechazado:'Rechazado' };
const COLORS  = { pendiente:'#718096', revision:'#d69e2e', entrevista:'#2d6a9f', aceptado:'#276749', rechazado:'#e53e3e' };

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { padding:'26px 16px 30px', maxWidth:1250, margin:'0 auto' },
  topBar: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:18 },
  select: { padding:'8px 14px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', background:'#fff', minWidth:320 },
  kanbanWrap: { background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:14, padding:'16px 14px', boxShadow:'0 2px 8px rgba(0,0,0,.04)' },
  kanban: { display:'flex', gap:14, overflowX:'auto', paddingBottom:8, justifyContent:'center' },
  col: { minWidth:230, maxWidth:260, background:'#f7fafc', borderRadius:10, padding:14, flex:'0 0 230px' },
  colHead: (c) => ({ fontWeight:700, fontSize:13, color:c, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }),
  card: { background:'#fff', borderRadius:8, padding:14, marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,.06)', fontSize:13 },
  btn: (c) => ({ padding:'4px 10px', background:c, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }),
  actionBtnRefresh: { background:'#e0f2fe', border:'1px solid #7dd3fc', color:'#0c4a6e', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 },
  actionBtnNew: { background:'#dcfce7', border:'1px solid #86efac', color:'#14532d', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 },
  backBtn: { background:'#ffffff', border:'1px solid #cbd5e0', color:'#2d3748', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:700 },
};

export default function DashboardEmpresa() {
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const isAdmin = user?.rol === 'admin';
  const [ofertas, setOfertas] = useState([]);
  const [ofertaId, setOfertaId] = useState('');
  const [postulantes, setPostulantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const cargarAdmin = async () => {
    const r = await api.get('/api/postulaciones/admin?limit=200');
    setPostulantes(r.data.data || []);
  };

  const cargarEmpresa = async () => {
    const r = await api.get('/api/ofertas?mine=true&limit=50');
    const list = r.data.data || [];
    setOfertas(list);
    if (list[0]) setOfertaId(list[0].id_oferta);
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        if (isAdmin) {
          await cargarAdmin();
        } else {
          await cargarEmpresa();
        }
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    if (!ofertaId) return;
    api.get(`/api/postulaciones/oferta/${ofertaId}?limit=100`)
      .then(r => setPostulantes(r.data.data || []))
      .catch(() => {});
  }, [ofertaId]);

  const cambiarEstado = async (id_postulacion, estado) => {
    try {
      await api.put(`/api/postulaciones/${id_postulacion}/estado`, { estado });
      setPostulantes(ps => ps.map(p => p.id_postulacion === id_postulacion ? { ...p, estado } : p));
    } catch (e) {
      alert(e.response?.data?.message || 'No se pudo actualizar el estado');
    }
  };

  const refrescar = async () => {
    try {
      if (isAdmin) {
        await cargarAdmin();
      } else if (ofertaId) {
        const r = await api.get(`/api/postulaciones/oferta/${ofertaId}?limit=100`);
        setPostulantes(r.data.data || []);
      }
    } catch {
      // no-op
    }
  };

  const byEstado = (e) => postulantes.filter(p => p.estado === e);

  const actionsForState = (estado) => {
    if (estado === 'pendiente') return [{ to:'revision', label:'→ Revisión', color:'#2d6a9f' }];
    if (estado === 'revision') return [
      { to:'pendiente', label:'← Pendiente', color:'#4a5568' },
      { to:'entrevista', label:'→ Entrevista', color:'#2d6a9f' },
    ];
    if (estado === 'entrevista') return [
      { to:'revision', label:'← Revisión', color:'#4a5568' },
      { to:'aceptado', label:'→ Aceptado', color:'#276749' },
      { to:'rechazado', label:'→ Rechazado', color:'#e53e3e' },
    ];
    if (estado === 'aceptado') return [{ to:'entrevista', label:'← Entrevista', color:'#4a5568' }];
    if (estado === 'rechazado') return [{ to:'entrevista', label:'← Entrevista', color:'#4a5568' }];
    return [];
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={{ fontWeight:700, fontSize:16 }}>{isAdmin ? '🛡️ Panel de Postulaciones (Admin)' : '🏢 Dashboard Empresa'}</span>
        <div style={{ display:'flex', gap:12 }}>
          <button style={s.actionBtnRefresh} onClick={refrescar}>🔄 Actualizar</button>
          <button style={s.actionBtnNew} onClick={() => navigate('/bolsa/empresa/oferta/nueva')}>✨ + Nueva Oferta</button>
        </div>
      </nav>
      <div style={s.body}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={() => navigate('/bolsa')}>🏠 Volver a Bolsa Laboral Inteligente</button>
          {!isAdmin && (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:14, fontWeight:600, color:'#4a5568' }}>Oferta:</span>
            <select style={s.select} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
              {!ofertas.length && <option value="">Sin ofertas publicadas</option>}
              {ofertas.map(o => <option key={o.id_oferta} value={o.id_oferta}>{o.titulo} ({o.total_postulantes || 0} postulantes)</option>)}
            </select>
            </div>
          )}
        </div>
        {isAdmin && (
          <div style={{ fontSize:13, color:'#4a5568', marginBottom:12, textAlign:'center' }}>
            Vista global: todas las postulaciones registradas en la bolsa laboral.
          </div>
        )}
        {loading && <div style={{ fontSize:13, color:'#718096', marginBottom:12, textAlign:'center' }}>Cargando postulaciones...</div>}
        <div style={{ fontSize:13, color:'#718096', marginBottom:14, textAlign:'center' }}>{postulantes.length} postulante{postulantes.length!==1?'s':''} en total</div>
        <div style={s.kanbanWrap}>
          <div style={s.kanban}>
          {ESTADOS.map(estado => (
            <div key={estado} style={s.col}>
              <div style={s.colHead(COLORS[estado])}>
                {LABELS[estado]} <span style={{ background:COLORS[estado]+'22', padding:'2px 8px', borderRadius:20, fontSize:11 }}>{byEstado(estado).length}</span>
              </div>
              {byEstado(estado).map(p => (
                <div key={p.id_postulacion} style={s.card}>
                  <div style={{ fontWeight:600, color:'#1a365d' }}>{p.nombres} {p.apellidos}</div>
                  <div style={{ color:'#718096', fontSize:11, marginTop:2 }}>{p.escuela || p.email}</div>
                  {isAdmin && (
                    <>
                      <div style={{ color:'#4a5568', fontSize:11, marginTop:4 }}>Oferta: {p.oferta_titulo}</div>
                      <div style={{ color:'#4a5568', fontSize:11, marginTop:2 }}>Empresa: {p.empresa}</div>
                    </>
                  )}
                  {p.puntaje_match && <div style={{ color:'#276749', fontWeight:700, fontSize:14, marginTop:4 }}>{p.puntaje_match}% match</div>}
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:10 }}>
                    {actionsForState(estado).map((a) => (
                      <button key={a.to} style={s.btn(a.color)} onClick={() => cambiarEstado(p.id_postulacion, a.to)}>{a.label}</button>
                    ))}
                  </div>
                </div>
              ))}
              {byEstado(estado).length === 0 && <div style={{ fontSize:12, color:'#a0aec0', textAlign:'center', padding:16 }}>Sin candidatos</div>}
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
