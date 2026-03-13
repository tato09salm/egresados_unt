import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav:  { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { maxWidth:1100, margin:'0 auto', padding:'28px 16px' },
  filters: { background:'#fff', borderRadius:10, padding:18, marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  input:  { padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', minWidth:150 },
  btn:    { padding:'8px 18px', background:'#553c9a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  btnOut: { padding:'8px 18px', background:'transparent', border:'1.5px solid #553c9a', color:'#553c9a', borderRadius:7, cursor:'pointer', fontSize:13 },
  grid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:20 },
  card:   { background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,.06)', cursor:'pointer', transition:'transform .15s' },
  avatar: { width:56, height:56, borderRadius:'50%', background:'#553c9a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, flexShrink:0 },
  tag:    { display:'inline-block', padding:'3px 9px', background:'#f3e8ff', color:'#553c9a', borderRadius:20, fontSize:11, fontWeight:500, margin:2 },
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
};

function Stars({ val }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(val||0) ? '#f6ad55' : '#e2e8f0', fontSize:16 }}>★</span>
      ))}
      <span style={{ fontSize:12, color:'#718096', marginLeft:4 }}>{val ? parseFloat(val).toFixed(1) : 'Sin calificación'}</span>
    </span>
  );
}

export default function DirectorioMentores() {
  const [mentores, setMentores] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [filtros, setFiltros]  = useState({ modalidad:'' });
  const [pagination, setPag]   = useState(null);
  const [page, setPage]        = useState(1);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  useEffect(() => { cargar(); }, [page, filtros]);

  const cargar = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:9, ...Object.fromEntries(Object.entries(filtros).filter(([,v])=>v)) });
      const r = await api.get(`/api/mentores?${params}`);
      setMentores(r.data.data || []);
      setPag(r.data.pagination);
    } catch(e) { if(e.response?.status===401) navigate('/login'); }
    setLoading(false);
  };

  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <span style={{ fontWeight:700, fontSize:16 }}>🤝 Red de Mentores SGE-UNT</span>
        <div style={{ display:'flex', gap:12 }}>
          <button style={s.logoutBtn} onClick={() => navigate('/mi-mentoria')}>Mi Mentoría</button>
          <button style={s.logoutBtn} onClick={() => navigate('/dashboard-mentor')}>Panel Mentor</button>
          <button style={s.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </nav>

      <div style={s.body}>
        <div style={s.filters}>
          <select style={s.input} value={filtros.modalidad} onChange={e=>{ setFiltros({...filtros,modalidad:e.target.value}); setPage(1); }}>
            <option value="">Cualquier modalidad</option>
            {['presencial','virtual','ambas'].map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <button style={s.btnOut} onClick={() => { setFiltros({ modalidad:'' }); setPage(1); }}>Limpiar filtros</button>
          {user.rol === 'egresado' && (
            <button style={{ ...s.btn, marginLeft:'auto' }} onClick={() => navigate('/dashboard-mentor')}>
              + Registrarme como Mentor
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#718096' }}>Cargando mentores...</div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#718096', marginBottom:16 }}>{pagination?.total || 0} mentores disponibles</div>
            <div style={s.grid}>
              {mentores.map(m => (
                <div key={m.id_mentor} style={s.card}
                  onClick={() => navigate(`/mentores/${m.id_mentor}`)}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-3px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform=''}>
                  <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                    <div style={s.avatar}>{m.nombres?.charAt(0)}{m.apellidos?.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight:700, color:'#1a365d', fontSize:15 }}>{m.nombres} {m.apellidos}</div>
                      <div style={{ fontSize:12, color:'#718096', marginTop:2 }}>{m.cargo_actual}</div>
                      <div style={{ fontSize:12, color:'#a0aec0' }}>{m.empresa_actual}</div>
                    </div>
                  </div>
                  <Stars val={m.calificacion_promedio} />
                  <div style={{ fontSize:12, color:'#718096', marginTop:8 }}>📚 {m.escuela}</div>
                  <div style={{ fontSize:12, color:'#553c9a', marginTop:4 }}>🕐 {m.disponibilidad_horas}h/semana · {m.modalidad}</div>
                  {m.especialidades?.length > 0 && (
                    <div style={{ marginTop:10 }}>{m.especialidades.slice(0,4).map((esp,i) => <span key={i} style={s.tag}>{esp}</span>)}</div>
                  )}
                  <div style={{ marginTop:14 }}>
                    <button style={{ ...s.btn, width:'100%', padding:'9px' }} onClick={e=>{e.stopPropagation(); navigate(`/mentores/${m.id_mentor}`);}}>
                      Ver perfil y solicitar →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!mentores.length && <div style={{ textAlign:'center', padding:60, color:'#a0aec0' }}>No se encontraron mentores</div>}
            {pagination?.totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
                <button style={s.btnOut} disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
                <span style={{ padding:'8px 16px', fontSize:13 }}>Pág. {pagination.page} / {pagination.totalPages}</span>
                <button style={s.btn} disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
