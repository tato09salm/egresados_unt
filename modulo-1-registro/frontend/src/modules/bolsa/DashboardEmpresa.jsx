import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const ESTADOS = ['pendiente','revision','entrevista','aceptado','rechazado'];
const LABELS  = { pendiente:'Pendiente', revision:'Revisión', entrevista:'Entrevista', aceptado:'Aceptado', rechazado:'Rechazado' };
const COLORS  = { pendiente:'#718096', revision:'#d69e2e', entrevista:'#2d6a9f', aceptado:'#276749', rechazado:'#e53e3e' };

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { padding:'24px 16px', maxWidth:1400, margin:'0 auto' },
  select: { padding:'8px 14px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', background:'#fff', marginBottom:20, minWidth:280 },
  kanban: { display:'flex', gap:14, overflowX:'auto', paddingBottom:16 },
  col: { minWidth:220, maxWidth:260, background:'#f7fafc', borderRadius:10, padding:14, flex:'0 0 220px' },
  colHead: (c) => ({ fontWeight:700, fontSize:13, color:c, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }),
  card: { background:'#fff', borderRadius:8, padding:14, marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,.06)', fontSize:13 },
  btn: (c) => ({ padding:'4px 10px', background:c, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }),
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
};

export default function DashboardEmpresa() {
  const [ofertas, setOfertas] = useState([]);
  const [ofertaId, setOfertaId] = useState('');
  const [postulantes, setPostulantes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/ofertas?mine=true&limit=50').then(r => {
      setOfertas(r.data.data || []);
      if (r.data.data?.[0]) { setOfertaId(r.data.data[0].id_oferta); }
    }).catch(() => navigate('/login'));
  }, []);

  useEffect(() => {
    if (!ofertaId) return;
    api.get(`/api/postulaciones/oferta/${ofertaId}?limit=100`)
      .then(r => setPostulantes(r.data.data || []))
      .catch(() => {});
  }, [ofertaId]);

  const cambiarEstado = async (id_postulacion, estado) => {
    await api.put(`/api/postulaciones/${id_postulacion}/estado`, { estado });
    setPostulantes(ps => ps.map(p => p.id_postulacion === id_postulacion ? { ...p, estado } : p));
  };

  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  const byEstado = (e) => postulantes.filter(p => p.estado === e);

  const actionsForState = (estado) => {
    if (estado === 'pendiente') return [{ to:'revision', label:'→ Revisión', color:'#d69e2e' }];
    if (estado === 'revision') return [{ to:'entrevista', label:'→ Entrevista', color:'#2d6a9f' }];
    if (estado === 'entrevista') return [
      { to:'aceptado', label:'✓ Aceptar', color:'#276749' },
      { to:'rechazado', label:'✗ Rechazar', color:'#e53e3e' },
    ];
    return [];
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={{ fontWeight:700, fontSize:16 }}>🏢 Dashboard Empresa</span>
        <div style={{ display:'flex', gap:12 }}>
          <button style={s.logoutBtn} onClick={() => navigate('/bolsa/empresa/oferta/nueva')}>+ Nueva Oferta</button>
          <button style={s.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </nav>
      <div style={s.body}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <span style={{ fontSize:14, fontWeight:600, color:'#4a5568' }}>Oferta:</span>
          <select style={s.select} value={ofertaId} onChange={e => setOfertaId(e.target.value)}>
            {!ofertas.length && <option value="">Sin ofertas publicadas</option>}
            {ofertas.map(o => <option key={o.id_oferta} value={o.id_oferta}>{o.titulo} ({o.total_postulantes || 0} postulantes)</option>)}
          </select>
        </div>
        <div style={{ fontSize:13, color:'#718096', marginBottom:16 }}>{postulantes.length} postulante{postulantes.length!==1?'s':''} en total</div>
        <div style={s.kanban}>
          {ESTADOS.map(estado => (
            <div key={estado} style={s.col}>
              <div style={s.colHead(COLORS[estado])}>
                {LABELS[estado]} <span style={{ background:COLORS[estado]+'22', padding:'2px 8px', borderRadius:20, fontSize:11 }}>{byEstado(estado).length}</span>
              </div>
              {byEstado(estado).map(p => (
                <div key={p.id_postulacion} style={s.card}>
                  <div style={{ fontWeight:600, color:'#1a365d' }}>{p.nombres} {p.apellidos}</div>
                  <div style={{ color:'#718096', fontSize:11, marginTop:2 }}>{p.escuela}</div>
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
  );
}
