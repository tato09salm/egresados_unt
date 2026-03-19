import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8', fontFamily:'system-ui,sans-serif' },
  nav:  { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { maxWidth:1200, margin:'0 auto', padding:'28px 16px' },
  filters: { background:'#fff', borderRadius:12, padding:20, marginBottom:24, display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end', boxShadow:'0 1px 6px rgba(0,0,0,.07)' },
  filterGroup: { display:'flex', flexDirection:'column', gap:4 },
  label: { fontSize:11, fontWeight:600, color:'#718096', textTransform:'uppercase', letterSpacing:.5 },
  input:  { padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', minWidth:150, background:'#fff' },
  btn:    { padding:'8px 18px', background:'#553c9a', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:600 },
  btnOut: { padding:'8px 18px', background:'transparent', border:'1.5px solid #553c9a', color:'#553c9a', borderRadius:7, cursor:'pointer', fontSize:13 },
  btnGray:{ padding:'8px 18px', background:'transparent', border:'1.5px solid #cbd5e0', color:'#718096', borderRadius:7, cursor:'pointer', fontSize:13 },
  grid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:20 },
  card:   { background:'#fff', borderRadius:14, padding:22, boxShadow:'0 2px 10px rgba(0,0,0,.07)', cursor:'pointer', transition:'all .18s', border:'2px solid transparent' },
  avatar: { width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,#553c9a,#805ad5)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, flexShrink:0, overflow:'hidden' },
  tag:    { display:'inline-block', padding:'3px 9px', background:'#f3e8ff', color:'#553c9a', borderRadius:20, fontSize:11, fontWeight:500, margin:2 },
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  backBtn: { background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
};

function Stars({ val }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(val||0) ? '#f6ad55' : '#e2e8f0', fontSize:15 }}>★</span>
      ))}
      <span style={{ fontSize:12, color:'#718096', marginLeft:4 }}>{val ? parseFloat(val).toFixed(1) : 'Sin cal.'}</span>
    </span>
  );
}

export default function DirectorioMentores() {
  const [mentores, setMentores] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [escuelas, setEscuelas] = useState([]);
  const [habilidades, setHabilidades] = useState([]);
  const [filtros, setFiltros]  = useState({ modalidad:'', escuela:'', especialidad:'', nombre:'', disponibilidad:'' });
  const [pagination, setPag]   = useState(null);
  const [page, setPage]        = useState(1);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar filtros auxiliares //comentario
    api.get('/api/perfil/escuelas').then(r => setEscuelas(r.data.data || [])).catch(() => {});
    api.get('/api/perfil/habilidades').then(r => setHabilidades(r.data.data || [])).catch(() => {});
  }, []);

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

  const limpiar = () => { setFiltros({ modalidad:'', escuela:'', especialidad:'', nombre:'', disponibilidad:'' }); setPage(1); };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(26,54,93);
    doc.text('Directorio de Mentores - SGE UNT', 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')} | Total: ${pagination?.total || mentores.length}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [['Mentor','Cargo / Empresa','Escuela','Especialidades','Calificación','Modalidad']],
      body: mentores.map(m => [
        `${m.nombres} ${m.apellidos}`,
        `${m.cargo_actual || '-'}\n${m.empresa_actual || '-'}`,
        m.escuela || '-',
        (m.especialidades || []).join(', ') || '-',
        m.calificacion_promedio ? parseFloat(m.calificacion_promedio).toFixed(1)+'/5' : 'Sin cal.',
        m.modalidad || '-',
      ]),
      styles: { fontSize:9 },
      headStyles: { fillColor:[85,60,154] },
      alternateRowStyles: { fillColor:[248,245,255] },
    });
    doc.save('directorio_mentores.pdf');
  };

  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>← Regresar</button>
          <span style={{ fontWeight:700, fontSize:16 }}>🤝 Red de Mentores SGE-UNT</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={s.logoutBtn} onClick={() => navigate('/mi-mentoria')}>Mi Mentoría</button>
          {user.rol === 'admin' ? (
            <button style={{ ...s.logoutBtn, background:'#2b6cb0' }} onClick={() => navigate('/dashboard-mentor')}>Panel Mentor (Admin)</button>
          ) : (
            <button style={s.logoutBtn} onClick={() => navigate('/dashboard-mentor')}>Panel Mentor</button>
          )}
          <button style={{ ...s.logoutBtn, borderColor:'rgba(255,255,255,.3)', border:'1px solid' }} onClick={exportarPDF}>📄 PDF</button>
          <button style={s.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </nav>

      <div style={s.body}>
        {/* Filtros */}
        <div style={s.filters}>
          <div style={s.filterGroup}>
            <span style={s.label}>Buscar por nombre</span>
            <input style={{ ...s.input, minWidth:200 }} placeholder="Nombre del mentor..."
              value={filtros.nombre} onChange={e=>{ setFiltros({...filtros,nombre:e.target.value}); setPage(1); }} />
          </div>
          <div style={s.filterGroup}>
            <span style={s.label}>Modalidad</span>
            <select style={s.input} value={filtros.modalidad} onChange={e=>{ setFiltros({...filtros,modalidad:e.target.value}); setPage(1); }}>
              <option value="">Todas</option>
              {['presencial','virtual','ambas'].map(m=><option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
            </select>
          </div>
          {escuelas.length > 0 && (
            <div style={s.filterGroup}>
              <span style={s.label}>Escuela</span>
              <select style={s.input} value={filtros.escuela} onChange={e=>{ setFiltros({...filtros,escuela:e.target.value}); setPage(1); }}>
                <option value="">Todas las escuelas</option>
                {escuelas.map(e=><option key={e.id_escuela} value={e.id_escuela}>{e.nombre}</option>)}
              </select>
            </div>
          )}
          {habilidades.length > 0 && (
            <div style={s.filterGroup}>
              <span style={s.label}>Especialidad</span>
              <select style={s.input} value={filtros.especialidad} onChange={e=>{ setFiltros({...filtros,especialidad:e.target.value}); setPage(1); }}>
                <option value="">Todas las especialidades</option>
                {habilidades.map(h=><option key={h.id_habilidad} value={h.id_habilidad}>{h.nombre}</option>)}
              </select>
            </div>
          )}
          <div style={s.filterGroup}>
            <span style={s.label}>Disponibilidad mín. (h/semana)</span>
            <input style={{ ...s.input, minWidth:120 }} type="number" min="1" placeholder="Ej: 2"
              value={filtros.disponibilidad} onChange={e=>{ setFiltros({...filtros,disponibilidad:e.target.value}); setPage(1); }} />
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            <button style={s.btnGray} onClick={limpiar}>Limpiar</button>
            <button style={{ ...s.btnOut, color:'#c53030', borderColor:'#c53030' }} onClick={exportarPDF} title="Exportar a PDF">📄 PDF</button>
            {user.rol === 'egresado' && (
              <button style={s.btn} onClick={() => navigate('/dashboard-mentor')}>+ Ser Mentor</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#718096' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>Cargando mentores...
          </div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#718096', marginBottom:16, display:'flex', justifyContent:'space-between' }}>
              <span>{pagination?.total || 0} mentores disponibles</span>
            </div>
            <div style={s.grid}>
              {mentores.map(m => (
                <div key={m.id_mentor} style={s.card}
                  onClick={() => navigate(`/mentores/${m.id_mentor}`)}
                  onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor='#b794f4'; e.currentTarget.style.boxShadow='0 8px 24px rgba(85,60,154,.15)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,.07)'; }}>
                  <div style={{ display:'flex', gap:14, marginBottom:14 }}>
                    <div style={s.avatar}>
                      {m.foto_url
                        ? <img src={m.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <>{m.nombres?.charAt(0)}{m.apellidos?.charAt(0)}</>}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#1a365d', fontSize:15 }}>{m.nombres} {m.apellidos}</div>
                      <div style={{ fontSize:12, color:'#553c9a', marginTop:2, fontWeight:500 }}>{m.cargo_actual}</div>
                      <div style={{ fontSize:12, color:'#a0aec0' }}>{m.empresa_actual}</div>
                    </div>
                  </div>
                  <Stars val={m.calificacion_promedio} />
                  <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'#718096', background:'#f7fafc', padding:'3px 8px', borderRadius:6 }}>📚 {m.escuela}</span>
                    <span style={{ fontSize:11, color:'#718096', background:'#f7fafc', padding:'3px 8px', borderRadius:6 }}>🕐 {m.disponibilidad_horas}h/sem</span>
                    <span style={{ fontSize:11, color:'#553c9a', background:'#f3e8ff', padding:'3px 8px', borderRadius:6 }}>📡 {m.modalidad}</span>
                  </div>
                  {m.especialidades?.length > 0 && (
                    <div style={{ marginTop:10 }}>{m.especialidades.slice(0,3).map((esp,i) => <span key={i} style={s.tag}>{esp}</span>)}
                    {m.especialidades.length > 3 && <span style={{ ...s.tag, background:'#edf2f7', color:'#718096' }}>+{m.especialidades.length-3}</span>}</div>
                  )}
                  <div style={{ marginTop:14 }}>
                    <button style={{ ...s.btn, width:'100%', padding:'9px' }}
                      onClick={e=>{e.stopPropagation(); navigate(`/mentores/${m.id_mentor}`);}}>
                      Ver perfil →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {!mentores.length && (
              <div style={{ textAlign:'center', padding:60, color:'#a0aec0' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                No se encontraron mentores con esos filtros
              </div>
            )}
            {pagination?.totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
                <button style={s.btnOut} disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
                <span style={{ padding:'8px 16px', fontSize:13, color:'#4a5568' }}>Pág. {pagination.page} / {pagination.totalPages}</span>
                <button style={s.btn} disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
