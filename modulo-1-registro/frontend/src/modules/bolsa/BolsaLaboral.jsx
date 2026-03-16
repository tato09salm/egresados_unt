import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav:  { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { maxWidth:1100, margin:'0 auto', padding:'28px 16px' },
  filters: { background:'#fff', borderRadius:10, padding:20, marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end', boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  input: { padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', minWidth:140 },
  btn: { padding:'8px 18px', background:'#276749', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  btnOutline: { padding:'8px 18px', background:'transparent', border:'1.5px solid #276749', color:'#276749', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:20 },
  card: { background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,.06)', cursor:'pointer', transition:'transform .15s, box-shadow .15s', display:'flex', flexDirection:'column', gap:10 },
  badge: (c) => ({ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c }),
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
};

const modalidadColor = { presencial:'#276749', remoto:'#2d6a9f', hibrido:'#744210' };

export default function BolsaLaboral() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ modalidad:'', sector:'', salario_min:'', salario_max:'', habilidad:'' });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [recomendadas, setRecomendadas] = useState([]);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  useEffect(() => { cargarOfertas(); }, [page, filtros]);
  useEffect(() => {
    if (user.rol === 'egresado') {
      api.get('/api/match/recomendaciones').then(r => setRecomendadas(r.data.data || [])).catch(() => {});
    }
  }, []);

  const cargarOfertas = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit:9, ...Object.fromEntries(Object.entries(filtros).filter(([,v])=>v!=='')) });
      const r = await api.get(`/api/ofertas?${params}`);
      setOfertas(r.data.data || []);
      setPagination(r.data.pagination);
    } catch(e) { if(e.response?.status===401) navigate('/login'); }
    setLoading(false);
  };

  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  return (
    <div style={s.page}>
      <div style={s.body}>
        {/* Panel de Navegación de Bolsa */}
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {user.rol === 'egresado' && <button style={{...s.btn, background:'#1a365d'}} onClick={() => navigate('/bolsa/postulaciones')}>📁 Mis Postulaciones</button>}
          {user.rol === 'empresa' && <button style={{...s.btn, background:'#1a365d'}} onClick={() => navigate('/bolsa/empresa')}>🏢 Panel Empresa</button>}
        </div>

        {/* Recomendadas para egresados */}
        {recomendadas.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:14 }}>⭐ Recomendadas para ti</h3>
            <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8 }}>
              {recomendadas.map(o => (
                <div key={o.id_oferta} onClick={() => navigate(`/bolsa/ofertas/${o.id_oferta}`)}
                  style={{ ...s.card, minWidth:260, flexShrink:0, borderTop:'3px solid #f6ad55' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1a365d' }}>{o.titulo}</div>
                  <div style={{ fontSize:12, color:'#718096' }}>{o.empresa}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22, fontWeight:700, color:'#276749' }}>{o.puntaje_match}%</span>
                    <span style={{ fontSize:11, color:'#718096' }}>compatibilidad</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={s.filters}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>MODALIDAD</div>
            <select style={s.input} value={filtros.modalidad} onChange={e=>{ setFiltros({...filtros,modalidad:e.target.value}); setPage(1); }}>
              <option value="">Todas</option>
              {['presencial','remoto','hibrido'].map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SECTOR</div>
            <input style={s.input} placeholder="Buscar sector..." value={filtros.sector} onChange={e=>{ setFiltros({...filtros,sector:e.target.value}); setPage(1); }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SALARIO MINIMO</div>
            <input style={s.input} type="number" min="0" placeholder="Desde" value={filtros.salario_min} onChange={e=>{ setFiltros({...filtros,salario_min:e.target.value}); setPage(1); }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SALARIO MAXIMO</div>
            <input style={s.input} type="number" min="0" placeholder="Hasta" value={filtros.salario_max} onChange={e=>{ setFiltros({...filtros,salario_max:e.target.value}); setPage(1); }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>HABILIDAD</div>
            <input style={s.input} placeholder="Ej: React" value={filtros.habilidad} onChange={e=>{ setFiltros({...filtros,habilidad:e.target.value}); setPage(1); }} />
          </div>
          <button style={s.btnOutline} onClick={() => { setFiltros({ modalidad:'', sector:'', salario_min:'', salario_max:'', habilidad:'' }); setPage(1); }}>Limpiar</button>
          {user.rol === 'empresa' && (
            <button style={{ ...s.btn, marginLeft:'auto' }} onClick={() => navigate('/bolsa/empresa/oferta/nueva')}>+ Nueva Oferta</button>
          )}
        </div>

        {/* Listado */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#718096' }}>Cargando ofertas...</div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#718096', marginBottom:16 }}>
              {pagination ? `${pagination.total} ofertas encontradas` : ''}
            </div>
            <div style={s.grid}>
              {ofertas.map(o => (
                <div key={o.id_oferta} style={s.card}
                  onClick={() => navigate(`/bolsa/ofertas/${o.id_oferta}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.06)'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'#1a365d', flex:1 }}>{o.titulo}</div>
                    <span style={s.badge(modalidadColor[o.modalidad] || '#718096')}>{o.modalidad}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#718096' }}>🏢 {o.empresa}</div>
                  {user.rol === 'egresado' && Number.isFinite(Number(o.puntaje_match)) && (
                    <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontSize:22, fontWeight:700, color:'#276749' }}>{Math.round(Number(o.puntaje_match))}%</span>
                      <span style={{ fontSize:11, color:'#718096' }}>compatibilidad</span>
                    </div>
                  )}
                  {o.sector && <div style={{ fontSize:12, color:'#a0aec0' }}>📁 {o.sector}</div>}
                  <div style={{ fontSize:13, color:'#276749', fontWeight:600 }}>
                    {o.salario_min && o.salario_max ? `S/. ${o.salario_min.toLocaleString()} – ${o.salario_max.toLocaleString()}` : o.salario_min ? `S/. ${o.salario_min.toLocaleString()}+` : 'Salario a negociar'}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#a0aec0', marginTop:4 }}>
                    <span>📅 {new Date(o.fecha_publicacion).toLocaleDateString('es-PE')}</span>
                    <span>👥 {o.total_postulantes || 0} postulantes · {o.vacantes} vacante{o.vacantes>1?'s':''}</span>
                  </div>
                </div>
              ))}
            </div>
            {!ofertas.length && <div style={{ textAlign:'center', padding:60, color:'#a0aec0' }}>No se encontraron ofertas con los filtros aplicados</div>}
            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
                <button style={s.btnOutline} disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
                <span style={{ padding:'8px 16px', fontSize:13, color:'#718096' }}>Página {pagination.page} de {pagination.totalPages}</span>
                <button style={s.btn} disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
