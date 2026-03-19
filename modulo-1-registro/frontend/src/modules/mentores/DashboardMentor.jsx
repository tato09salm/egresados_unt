import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8', fontFamily:'system-ui,sans-serif' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  body: { maxWidth:1050, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  badge: c => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:c+'22', color:c }),
  btn:  c => ({ padding:'8px 18px', background:c, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }),
  btnSm: c => ({ padding:'6px 14px', background:c, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }),
  logoutBtn: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  backBtn: { background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  input: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', boxSizing:'border-box', background:'#fff' },
  registerCard: { background:'linear-gradient(135deg,#f3e8ff,#e9d8fd)', borderRadius:12, padding:24, border:'1px solid #d6bcfa' },
  // Modal overlay //comentario
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'#fff', borderRadius:16, padding:32, width:'90%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
  tabBar: { display:'flex', borderBottom:'2px solid #e2e8f0', marginBottom:20, gap:0 },
  tab: (active) => ({ padding:'10px 20px', border:'none', borderBottom: active ? '2px solid #553c9a' : '2px solid transparent', marginBottom:'-2px', background:'transparent', color: active ? '#553c9a':'#718096', fontWeight: active ? 700:400, cursor:'pointer', fontSize:14 }),
};

function CompletarModal({ onConfirm, onCancel }) {
  const [addNotes, setAddNotes] = useState(null);
  const [notes, setNotes] = useState('');
  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        {addNotes === null ? (
          <>
            <div style={{ fontSize:32, textAlign:'center', marginBottom:12 }}>✅</div>
            <h3 style={{ textAlign:'center', color:'#1a365d', marginBottom:8 }}>Marcar sesión como realizada</h3>
            <p style={{ textAlign:'center', color:'#718096', fontSize:14, marginBottom:24 }}>¿Deseas agregar comentarios o notas sobre esta sesión?</p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button style={{ ...s.btn('#553c9a'), padding:'10px 28px' }} onClick={() => setAddNotes(true)}>💬 Sí, agregar notas</button>
              <button style={{ padding:'10px 20px', background:'#f7fafc', border:'1.5px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:13, color:'#4a5568' }} onClick={() => onConfirm(null)}>Omitir y completar</button>
            </div>
            <div style={{ textAlign:'center', marginTop:12 }}>
              <button onClick={onCancel} style={{ background:'none', border:'none', color:'#a0aec0', cursor:'pointer', fontSize:13 }}>Cancelar</button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ color:'#1a365d', marginBottom:8 }}>💬 Notas de la sesión</h3>
            <p style={{ color:'#718096', fontSize:13, marginBottom:14 }}>Escribe tus observaciones, compromisos o puntos clave de la sesión.</p>
            <textarea
              style={{ ...s.input, minHeight:130, resize:'vertical' }}
              placeholder="Ej: Revisamos el portafolio del mentorado, acordamos trabajar en proyectos de GitHub..."
              value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
            <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'flex-end' }}>
              <button style={{ padding:'10px 20px', background:'#f7fafc', border:'1.5px solid #e2e8f0', borderRadius:6, cursor:'pointer', fontSize:13 }} onClick={onCancel}>Cancelar</button>
              <button style={{ ...s.btn('#276749'), padding:'10px 24px' }} onClick={() => onConfirm(notes)}>✓ Guardar y completar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditarPerfilModal({ mentor, onSave, onCancel, habilidades }) {
  const [form, setForm] = useState({
    area_expertise: mentor?.area_expertise || '',
    empresa_actual: mentor?.empresa_actual || '',
    cargo_actual: mentor?.cargo_actual || '',
    disponibilidad_horas: mentor?.disponibilidad_horas || 4,
    modalidad: mentor?.modalidad || 'ambas',
    bio: mentor?.bio || '',
    telefono: mentor?.telefono || '',
    email: mentor?.email || '',
    especialidades: mentor?.especialidad_ids || [],
  });
  const [foto, setFoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const guardar = async () => {
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => {
        if (k === 'especialidades') fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (foto) fd.append('foto', foto);
      await api.put('/api/mentores/perfil', fd, { headers: { 'Content-Type':'multipart/form-data' } });
      onSave();
    } catch(e) { setMsg(e.response?.data?.message || 'Error al guardar'); }
    setSaving(false);
  };

  const toggleHab = (id) => {
    const cur = form.especialidades || [];
    setForm({ ...form, especialidades: cur.includes(id) ? cur.filter(x=>x!==id) : [...cur, id] });
  };

  const tagStyle = (active) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    margin: 3,
    cursor: 'pointer',
    background: active ? '#553c9a' : '#f3e8ff',
    color: active ? '#fff' : '#553c9a',
    border: 'none'
  });

  return (
    <div style={s.overlay}>
      <div style={{ ...s.modal, maxWidth:560, maxHeight:'90vh', overflowY:'auto' }}>
        <h3 style={{ color:'#1a365d', marginBottom:20 }}>✏️ Editar información de mentor</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['Área de expertise','area_expertise'],['Empresa actual','empresa_actual'],['Cargo actual','cargo_actual'],['Teléfono','telefono'],['Email','email']].map(([l,k]) => (
            <div key={k}>
              <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:4 }}>{l}</label>
              <input style={s.input} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:4 }}>Horas disponibles/sem.</label>
            <input type="number" style={s.input} value={form.disponibilidad_horas} onChange={e=>setForm({...form,disponibilidad_horas:e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:4 }}>Modalidad</label>
            <select style={{ ...s.input }} value={form.modalidad} onChange={e=>setForm({...form,modalidad:e.target.value})}>
              {['presencial','virtual','ambas'].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:8 }}>Especialidades (habilidades)</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', maxHeight:150, overflowY:'auto', padding:10, border:'1.5px solid #e2e8f0', borderRadius:8 }}>
            {(habilidades || []).map(h => (
              <button key={h.id_habilidad} 
                onClick={() => toggleHab(h.id_habilidad)}
                style={tagStyle((form.especialidades || []).includes(h.id_habilidad))}>
                {h.nombre}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:4 }}>Acerca de mí (bio)</label>
          <textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="Describe tu experiencia y cómo puedes ayudar..." />
        </div>
        <div style={{ marginTop:12 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'#4a5568', display:'block', marginBottom:4 }}>📷 Foto de perfil</label>
          <input type="file" accept="image/*" onChange={e=>setFoto(e.target.files[0])} style={{ fontSize:13 }} />
          {foto && <div style={{ fontSize:12, color:'#718096', marginTop:4 }}>Seleccionado: {foto.name}</div>}
        </div>
        {msg && <div style={{ marginTop:12, background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px 14px', fontSize:13 }}>{msg}</div>}
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button style={{ padding:'10px 20px', background:'#f7fafc', border:'1.5px solid #e2e8f0', borderRadius:6, cursor:'pointer' }} onClick={onCancel}>Cancelar</button>
          <button style={{ ...s.btn('#553c9a'), padding:'10px 28px' }} onClick={guardar} disabled={saving}>{saving ? 'Guardando...':'💾 Guardar'}</button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardMentor() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [sesiones, setSesiones]       = useState([]);
  const [isMentor, setIsMentor]       = useState(null);
  const [mentorData, setMentorData]   = useState(null);
  const [tab, setTab]                 = useState('solicitudes');
  const [habilidades, setHabilidades] = useState([]);
  const [regForm, setRegForm]         = useState({ area_expertise:'', empresa_actual:'', cargo_actual:'', disponibilidad_horas:4, modalidad:'ambas', bio:'', especialidades:[] });
  const [regFoto, setRegFoto]         = useState(null);
  const [regMsg, setRegMsg]           = useState('');
  const [completarModal, setCompletarModal] = useState(null);
  const [editarModal, setEditarModal]       = useState(false);
  const [agendarData, setAgendarData] = useState({ solicitudId:'', fecha_hora:'', modalidad:'virtual', enlace_virtual:'' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  const cargar = async () => {
    try {
      const [sol, ses, men, hab] = await Promise.all([
        api.get('/api/mentores/mis-solicitudes').catch(() => ({ data: { data: [] } })),
        api.get('/api/sesiones').catch(() => ({ data: { data: [] } })),
        api.get('/api/mentores/me').catch(() => ({ data: { data: null } })),
        api.get('/api/perfil/habilidades').catch(() => ({ data: { data: [] } }))
      ]);

      const solicitudesData = sol.data?.data || [];
      const sesionesData = ses.data?.data || [];
      const habilidadesData = hab.data?.data || [];

      setSolicitudes(solicitudesData);
      setSesiones(sesionesData);
      setHabilidades(habilidadesData);
      
      if (user.rol === 'admin') {
        setIsMentor(true);
        setMentorData({ area_expertise: 'Administración de Sistema', nombres: 'Admin', apellidos: '' });
      } else if (men.data?.data) {
        setMentorData(men.data.data);
        setIsMentor(true);
      } else {
        setMentorData(null);
        setIsMentor(false);
      }
    } catch (e) {
      console.error('Error cargando dashboard de mentor:', e);
      setMentorData(null);
      setIsMentor(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const responder = async (id, estado) => {
    try {
      await api.put(`/api/mentoria/${id}/responder`, { estado });
      cargar();
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
  };

  const agendar = async () => {
    if (!agendarData.solicitudId || !agendarData.fecha_hora) return alert('Completa los campos requeridos');
    try {
      await api.post('/api/sesiones', {
        id_solicitud: agendarData.solicitudId,
        fecha_hora: agendarData.fecha_hora,
        modalidad: agendarData.modalidad,
        enlace_virtual: agendarData.enlace_virtual || null,
      });
      setAgendarData({ solicitudId:'', fecha_hora:'', modalidad:'virtual', enlace_virtual:'' });
      await cargar();
      setTab('sesiones');
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
  };

  const completar = (id) => setCompletarModal(id);

  const onCompletarConfirm = async (notas) => {
    try {
      await api.put(`/api/sesiones/${completarModal}/completar`, { notas_mentor: notas });
      setCompletarModal(null);
      await cargar();
    } catch(e) { alert(e.response?.data?.message || 'Error'); setCompletarModal(null); }
  };

  const registrarMentor = async e => {
    e.preventDefault(); setRegMsg('');
    if (!regForm.especialidades.length) return setRegMsg('⚠️ Selecciona al menos una especialidad');
    try {
      const fd = new FormData();
      Object.entries(regForm).forEach(([k,v]) => {
        if (k === 'especialidades') fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      if (regFoto) fd.append('foto', regFoto);
      await api.post('/api/mentores/registro', fd, { headers:{'Content-Type':'multipart/form-data'} });
      setRegMsg('✓ Registrado como mentor exitosamente');
      setIsMentor(true);
      await cargar();
    } catch(e) { setRegMsg('⚠️ ' + (e.response?.data?.message || 'Error')); }
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(26,54,93);
    doc.text('Dashboard del Mentor - SGE UNT', 14, 22);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);

    autoTable(doc, {
      startY: 36, head:[['#','Mentorado','Escuela','Estado','Objetivo','Fecha']],
      body: (solicitudes || []).map((s,i) => [i+1, `${s.nombres} ${s.apellidos}`, s.escuela, s.estado, s.objetivo || '-', new Date(s.fecha_solicitud).toLocaleDateString('es-PE')]),
      headStyles:{ fillColor:[85,60,154] },
    });

    const y2 = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.setTextColor(26,54,93);
    doc.text('Sesiones', 14, y2);
    autoTable(doc, {
      startY: y2+4, head:[['Fecha','Mentorado','Modalidad','Estado']],
      body: (sesiones || []).map(se => [new Date(se.fecha_hora).toLocaleString('es-PE'), `${se.mentorado_nombre} ${se.mentorado_apellido}`, se.modalidad, se.realizada?'Realizada':'Pendiente']),
      headStyles:{ fillColor:[85,60,154] },
    });
    doc.save('dashboard_mentor.pdf');
  };

  const pendientes = (solicitudes || []).filter(s => s.estado === 'pendiente');
  const aceptadas  = (solicitudes || []).filter(s => s.estado === 'aceptada');
  const logout = () => { localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user'); navigate('/login'); };

  if (isMentor === null) return <div style={{padding:20, textAlign:'center'}}>Cargando panel...</div>;

  return (
    <div style={s.page}>
      {completarModal && <CompletarModal onConfirm={onCompletarConfirm} onCancel={() => setCompletarModal(null)} />}
      {editarModal && <EditarPerfilModal mentor={mentorData} habilidades={habilidades} onSave={() => { setEditarModal(false); cargar(); }} onCancel={() => setEditarModal(false)} />}

      <nav style={s.nav}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>← Regresar</button>
          <span style={{ fontWeight:700, fontSize:16 }}>🏅 Panel del Mentor</span>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={s.logoutBtn} onClick={() => navigate('/mentores')}>Directorio</button>
          <button style={s.logoutBtn} onClick={() => navigate('/mi-mentoria')}>Mi Mentoría</button>
          <button style={{ ...s.logoutBtn, borderColor:'rgba(255,255,255,.3)', border:'1px solid' }} onClick={exportarPDF}>📄 PDF</button>
          <button style={s.logoutBtn} onClick={logout}>Salir</button>
        </div>
      </nav>

      <div style={s.body}>
        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
          {[
            ['Solicitudes Pendientes', (pendientes || []).length, '#d69e2e', '📩'],
            ['Mentorados Activos', (aceptadas || []).length, '#276749', '👥'],
            ['Sesiones Realizadas', (sesiones || []).filter(s=>s.realizada).length, '#553c9a', '✅'],
            ['Total Solicitudes', (solicitudes || []).length, '#2b6cb0', '📋'],
          ].map(([l,v,c,ic]) => (
            <div key={l} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,.06)', borderLeft:`4px solid ${c}` }}>
              <div style={{ fontSize:26 }}>{ic}</div>
              <div style={{ fontSize:28, fontWeight:700, color:c, margin:'4px 0' }}>{v}</div>
              <div style={{ fontSize:12, color:'#718096' }}>{l}</div>
            </div>
          ))}
        </div>

{/* Registro como mentor (solo egresados que no son mentores ni admin) */}
{!isMentor && user.rol === 'egresado' && (
  <div style={s.registerCard}>
    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#553c9a', marginBottom: 16 }}>🎓 Registrarme como Mentor</h3>
    <p style={{ fontSize: 13, color: '#6b46c1', marginBottom: 18 }}>Requiere al menos 2 años de experiencia laboral verificable en tu perfil.</p>
    <form onSubmit={registrarMentor}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[['Área de expertise*', 'area_expertise'], ['Empresa actual*', 'empresa_actual'], ['Cargo actual*', 'cargo_actual']].map(([l, k]) => (
          <div key={k}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 4 }}>{l}</label>
            <input required style={{ ...s.input }} value={regForm[k] || ''} onChange={e => setRegForm({ ...regForm, [k]: e.target.value })} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 4 }}>Horas disponibles/sem.*</label>
          <input type="number" min="1" max="40" required style={s.input} value={regForm.disponibilidad_horas || 4} onChange={e => setRegForm({ ...regForm, disponibilidad_horas: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 4 }}>Modalidad*</label>
          <select style={{ ...s.input }} value={regForm.modalidad || 'ambas'} onChange={e => setRegForm({ ...regForm, modalidad: e.target.value })}>
            {['presencial', 'virtual', 'ambas'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 8 }}>Especialidades (selecciona tus fortalezas)*</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 120, overflowY: 'auto', padding: 10, border: '1.5px solid #d6bcfa', borderRadius: 8, background: '#fff' }}>
          {(habilidades || []).map(h => {
            const active = (regForm.especialidades || []).includes(h.id_habilidad);
            return (
              <button key={h.id_habilidad} type="button"
                onClick={() => {
                  const cur = regForm.especialidades || [];
                  setRegForm({ ...regForm, especialidades: cur.includes(h.id_habilidad) ? cur.filter(x => x !== h.id_habilidad) : [...cur, h.id_habilidad] });
                }}
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  margin: 3,
                  cursor: 'pointer',
                  background: active ? '#553c9a' : '#f3e8ff',
                  color: active ? '#fff' : '#553c9a',
                  border: 'none'
                }}>
                {h.nombre}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 4 }}>Acerca de mí (bio)</label>
        <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={regForm.bio || ''} onChange={e => setRegForm({ ...regForm, bio: e.target.value })} placeholder="Describe tu experiencia y cómo puedes ayudar..." />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#553c9a', display: 'block', marginBottom: 4 }}>📷 Foto de perfil</label>
        <input type="file" accept="image/*" onChange={e => setRegFoto(e.target.files[0])} style={{ fontSize: 13 }} />
      </div>
      {regMsg && <div style={{ marginTop: 12, fontSize: 13, color: regMsg.startsWith('✓') ? '#276749' : '#c53030', background: regMsg.startsWith('✓') ? '#f0fff4' : '#fff5f5', borderRadius: 6, padding: '8px 12px' }}>{regMsg}</div>}
      <button type="submit" style={{ ...s.btn('#553c9a'), marginTop: 16, padding: '10px 24px', fontSize: 13 }}>🎓 Registrarme como Mentor</button>
    </form>
  </div>
)}

{/* Editar perfil (si ya es mentor y no es admin) */}
{isMentor && user.rol !== 'admin' && (
  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
    <button style={{ ...s.btn('#2b6cb0'), padding: '10px 20px' }} onClick={() => setEditarModal(true)}>✏️ Editar mi perfil de mentor</button>
  </div>
)}

{/* Tabs */}
{isMentor && (
  <div style={s.card}>
    <div style={s.tabBar}>
      {[['solicitudes', '📩 Solicitudes'], ['agendar', '📅 Agendar Sesión'], ['sesiones', '📋 Mis Sesiones']].map(([k, l]) => (
        <button key={k} style={s.tab(tab === k)} onClick={() => setTab(k)}>{l}{k === 'solicitudes' && (pendientes || []).length > 0 && <span style={{ marginLeft: 6, background: '#e53e3e', color: '#fff', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>{(pendientes || []).length}</span>}</button>
      ))}
    </div>

    {tab === 'solicitudes' && (
      <>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a365d', marginBottom: 16 }}>Solicitudes de Mentoría</h3>
        {(solicitudes || []).length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#a0aec0' }}>No tienes solicitudes aún</div>}
        {(solicitudes || []).map(sol => (
          <div key={sol.id_solicitud} style={{ borderBottom: '1px solid #f0f4f8', paddingBottom: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1a365d', fontSize: 14 }}>{sol.nombres} {sol.apellidos}</div>
                {user.rol === 'admin' && sol.mentor_nombres && (
                  <div style={{ fontSize: 11, color: '#553c9a', fontWeight: 600 }}>Mentor: {sol.mentor_nombres} {sol.mentor_apellidos}</div>
                )}
                <div style={{ fontSize: 12, color: '#718096' }}>📚 {sol.escuela} · {new Date(sol.fecha_solicitud).toLocaleDateString('es-PE')}</div>
                <div style={{ fontSize: 13, color: '#4a5568', marginTop: 6, fontStyle: 'italic', background: '#f7fafc', padding: '8px 12px', borderRadius: 6 }}>"{sol.objetivo}"</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span style={s.badge(sol.estado === 'pendiente' ? '#d69e2e' : sol.estado === 'aceptada' ? '#276749' : '#e53e3e')}>{sol.estado}</span>
                {sol.estado === 'pendiente' && (
                  <>
                    <button style={s.btnSm('#276749')} onClick={() => responder(sol.id_solicitud, 'aceptada')}>✓ Aceptar</button>
                    <button style={s.btnSm('#e53e3e')} onClick={() => responder(sol.id_solicitud, 'rechazada')}>✗ Rechazar</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </>
    )}

    {tab === 'agendar' && (
      <>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a365d', marginBottom: 16 }}>Agendar Nueva Sesión</h3>
        {(aceptadas || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#a0aec0' }}>No tienes mentorados activos para agendar sesiones</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display:'block', marginBottom: 4 }}>Mentorado *</label>
              <select style={{ ...s.input }} value={agendarData.solicitudId} onChange={e => setAgendarData({ ...agendarData, solicitudId: e.target.value })}>
                <option value="">Seleccionar mentorado</option>
                {(aceptadas || []).map(s => <option key={s.id_solicitud} value={s.id_solicitud}>{s.nombres} {s.apellidos}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display:'block', marginBottom: 4 }}>Fecha y Hora *</label>
              <input type="datetime-local" style={s.input} value={agendarData.fecha_hora} onChange={e => setAgendarData({ ...agendarData, fecha_hora: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display:'block', marginBottom: 4 }}>Modalidad</label>
              <select style={s.input} value={agendarData.modalidad} onChange={e => setAgendarData({ ...agendarData, modalidad: e.target.value })}>
                {['virtual', 'presencial'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display:'block', marginBottom: 4 }}>Enlace virtual</label>
              <input style={s.input} placeholder="https://meet.google.com/..." value={agendarData.enlace_virtual} onChange={e => setAgendarData({ ...agendarData, enlace_virtual: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button style={{ ...s.btn('#553c9a'), padding: '10px 28px' }} onClick={agendar}>📅 Agendar Sesión</button>
            </div>
          </div>
        )}
      </>
    )}

    {tab === 'sesiones' && (
      <>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a365d', marginBottom: 16 }}>Calendario de Sesiones</h3>
        {(sesiones || []).length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#a0aec0' }}>No tienes sesiones agendadas</div>}
        {(sesiones || []).map(se => (
          <div key={se.id_sesion} style={{ borderBottom: '1px solid #f0f4f8', paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 600, color: '#2d3748', fontSize: 14 }}>{new Date(se.fecha_hora).toLocaleString('es-PE')}</div>
                <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                  👤 {se.mentorado_nombre} {se.mentorado_apellido} 
                  {user.rol === 'admin' && ` (Mentor: ${se.mentor_nombre} ${se.mentor_apellido})`}
                  · 📡 {se.modalidad} · ⏱ {se.duracion_min}min
                </div>
                {se.enlace_virtual && <a href={se.enlace_virtual} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#553c9a', display: 'block', marginTop: 2 }}>🔗 {se.enlace_virtual}</a>}
                {se.notas_mentor && <div style={{ marginTop: 6, fontSize: 12, color: '#4a5568', background: '#f7fafc', padding: '6px 10px', borderRadius: 6 }}>📝 {se.notas_mentor}</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <span style={s.badge(se.realizada ? '#276749' : '#d69e2e')}>{se.realizada ? 'Realizada' : 'Pendiente'}</span>
                {!se.realizada && <button style={s.btnSm('#276749')} onClick={() => completar(se.id_sesion)}>✓ Completar</button>}
              </div>
            </div>
          </div>
        ))}
      </>
    )}
  </div>
)}
      </div>
    </div>
  );
}
