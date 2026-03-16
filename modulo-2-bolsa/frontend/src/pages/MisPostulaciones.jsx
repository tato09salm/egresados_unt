import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  back: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  body: { maxWidth:900, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:16 },
  badge:(c)=>({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:c+'22', color:c }),
};

const estadoColor = { pendiente:'#718096', revision:'#d69e2e', entrevista:'#2d6a9f', aceptado:'#276749', rechazado:'#e53e3e' };
const estadoLabel = { pendiente:'Pendiente', revision:'En Revisión', entrevista:'Entrevista', aceptado:'Aceptado ✓', rechazado:'Rechazado' };
const lineaEstados = ['pendiente','revision','entrevista','aceptado'];

export default function MisPostulaciones() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/postulaciones/mis-postulaciones')
      .then(r => setPosts(r.data.data || []))
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate('/ofertas')}>← Ofertas</button>
        <span style={{ fontWeight:700, fontSize:16 }}>📋 Mis Postulaciones</span>
      </nav>
      <div style={s.body}>
        {loading ? <div style={{ textAlign:'center', padding:60 }}>Cargando...</div> :
         posts.length === 0 ? <div style={{ textAlign:'center', padding:60, color:'#a0aec0' }}>Aún no tienes postulaciones</div> :
         posts.map(p => (
          <div key={p.id_postulacion} style={s.card} onClick={() => navigate(`/ofertas/${p.id_oferta}`)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#1a365d' }}>{p.titulo}</div>
                <div style={{ fontSize:13, color:'#718096', marginTop:4 }}>🏢 {p.empresa}</div>
                <div style={{ fontSize:12, color:'#a0aec0', marginTop:2 }}>📅 {new Date(p.fecha_postulacion).toLocaleDateString('es-PE')}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={s.badge(estadoColor[p.estado])}>{estadoLabel[p.estado]}</span>
                {p.puntaje_match && <div style={{ fontSize:20, fontWeight:700, color:'#276749', marginTop:6 }}>{p.puntaje_match}%</div>}
              </div>
            </div>
            {/* Timeline de estados */}
            <div style={{ display:'flex', marginTop:16, gap:0 }}>
              {lineaEstados.map((e,i) => {
                const active = p.estado === 'rechazado' ? i <= 2 : lineaEstados.indexOf(p.estado) >= i;
                return (
                  <React.Fragment key={e}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1 }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background: active ? (p.estado === 'rechazado' ? '#e53e3e' : '#276749') : '#e2e8f0', border:'2px solid', borderColor: active ? (p.estado === 'rechazado' ? '#e53e3e' : '#276749') : '#e2e8f0' }} />
                      <div style={{ fontSize:10, color: active ? (p.estado === 'rechazado' ? '#e53e3e' : '#276749') : '#a0aec0', marginTop:4, textAlign:'center' }}>{estadoLabel[e]}</div>
                    </div>
                    {i < 3 && <div style={{ height:2, background: active && ((p.estado === 'rechazado' && i < 2) || (p.estado !== 'rechazado' && lineaEstados.indexOf(p.estado) > i)) ? (p.estado === 'rechazado' ? '#e53e3e' : '#276749') : '#e2e8f0', flex:1, marginTop:7 }} />}
                  </React.Fragment>
                );
              })}
            </div>
            {p.estado === 'rechazado' && (
              <div style={{ marginTop:10, fontSize:11, fontWeight:600, color:'#e53e3e' }}>Proceso finalizado en Rechazado</div>
            )}
          </div>
         ))
        }
      </div>
    </div>
  );
}
