import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_mentores';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  body: { maxWidth:1000, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:24, boxShadow:'0 2px 8px rgba(0,0,0,.06)', marginBottom:20 },
  badge: c => ({ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:c+'22', color:c }),
  btn:  c => ({ padding:'8px 18px', background:c, color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }),
  input: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none' },
  registerCard: { background:'#f3e8ff', borderRadius:12, padding:24, border:'1px solid #d6bcfa' },
};

export default function DashboardMentor() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [sesiones, setSesiones]       = useState([]);
  const [isMentor, setIsMentor]       = useState(null);
  const [regForm, setRegForm]         = useState({ area_expertise:'', empresa_actual:'', cargo_actual:'', disponibilidad_horas:4, modalidad:'ambas' });
  const [regMsg, setRegMsg]           = useState('');
  const [agendarData, setAgendarData] = useState({ solicitudId:'', fecha_hora:'', modalidad:'virtual', enlace_virtual:'' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  useEffect(() => {
    Promise.all([
      api.get('/api/mentores/mis-solicitudes').catch(() => ({ data:{ data:[] } })),
      api.get('/api/sesiones').catch(() => ({ data:{ data:[] } })),
    ]).then(([sol, ses]) => {
      setSolicitudes(sol.data.data || []);
      setSesiones(ses.data.data || []);
      setIsMentor(sol.data.success !== false);
    });
  }, []);

  const responder = async (id, estado) => {
    await api.put(`/api/mentoria/${id}/responder`, { estado });
    const r = await api.get('/api/mentores/mis-solicitudes');
    setSolicitudes(r.data.data || []);
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
      const r = await api.get('/api/sesiones');
      setSesiones(r.data.data || []);
      alert('Sesión agendada');
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
  };

  const completar = async (id) => {
    const notas = window.prompt('Notas de la sesión (opcional):');
    await api.put(`/api/sesiones/${id}/completar`, { notas_mentor: notas || '' });
    const r = await api.get('/api/sesiones');
    setSesiones(r.data.data || []);
  };

  const registrarMentor = async e => {
    e.preventDefault(); setRegMsg('');
    try {
      await api.post('/api/mentores/registro', regForm);
      setRegMsg('✓ Registrado como mentor exitosamente');
      setIsMentor(true);
    } catch(e) { setRegMsg('⚠️ ' + (e.response?.data?.message || 'Error')); }
  };

  const pendientes = solicitudes.filter(s => s.estado === 'pendiente');
  const aceptadas  = solicitudes.filter(s => s.estado === 'aceptada');

  return (
    <div style={s.page}>
      <div style={s.body}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          {[['Solicitudes Pendientes', pendientes.length, '#d69e2e', '📩'],['Mentorados Activos', aceptadas.length, '#276749', '👥'],['Sesiones Realizadas', sesiones.filter(s=>s.realizada).length, '#553c9a', '✅']].map(([l,v,c,ic]) => (
            <div key={l} style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 2px 8px rgba(0,0,0,.06)', borderLeft:`4px solid ${c}` }}>
              <div style={{ fontSize:28 }}>{ic}</div>
              <div style={{ fontSize:28, fontWeight:700, color:c, marginTop:4 }}>{v}</div>
              <div style={{ fontSize:12, color:'#718096' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Registro como mentor */}
        {!isMentor && (
          <div style={s.registerCard}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#553c9a', marginBottom:16 }}>Registrarme como Mentor</h3>
            <form onSubmit={registrarMentor}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['Área de expertise','area_expertise'],['Empresa actual','empresa_actual'],['Cargo actual','cargo_actual']].map(([l,k]) => (
                  <div key={k}><label style={{ fontSize:12, fontWeight:600, color:'#553c9a' }}>{l}</label>
                    <input style={{ ...s.input, marginTop:4 }} value={regForm[k]} onChange={e=>setRegForm({...regForm,[k]:e.target.value})} /></div>
                ))}
                <div><label style={{ fontSize:12, fontWeight:600, color:'#553c9a' }}>Horas disponibles/semana</label>
                  <input type="number" style={{ ...s.input, marginTop:4 }} value={regForm.disponibilidad_horas} onChange={e=>setRegForm({...regForm,disponibilidad_horas:e.target.value})} /></div>
                <div><label style={{ fontSize:12, fontWeight:600, color:'#553c9a' }}>Modalidad</label>
                  <select style={{ ...s.input, marginTop:4, background:'#fff' }} value={regForm.modalidad} onChange={e=>setRegForm({...regForm,modalidad:e.target.value})}>
                    {['presencial','virtual','ambas'].map(m=><option key={m}>{m}</option>)}
                  </select></div>
              </div>
              {regMsg && <div style={{ marginTop:12, fontSize:13, color: regMsg.startsWith('✓')?'#276749':'#c53030' }}>{regMsg}</div>}
              <button type="submit" style={{ ...s.btn('#553c9a'), marginTop:16, padding:'10px 24px' }}>Registrarme como Mentor</button>
            </form>
          </div>
        )}

        {/* Solicitudes pendientes */}
        {pendientes.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 }}>📩 Solicitudes Pendientes ({pendientes.length})</h3>
            {pendientes.map(sol => (
              <div key={sol.id_solicitud} style={{ borderBottom:'1px solid #f0f4f8', paddingBottom:14, marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:600, color:'#1a365d' }}>{sol.nombres} {sol.apellidos}</div>
                    <div style={{ fontSize:12, color:'#718096' }}>{sol.escuela}</div>
                    <div style={{ fontSize:13, color:'#4a5568', marginTop:6, fontStyle:'italic' }}>"{sol.objetivo}"</div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button style={s.btn('#276749')} onClick={() => responder(sol.id_solicitud,'aceptada')}>✓ Aceptar</button>
                    <button style={s.btn('#e53e3e')} onClick={() => responder(sol.id_solicitud,'rechazada')}>✗ Rechazar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agendar sesión */}
        {aceptadas.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 }}>📅 Agendar Sesión</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={{ fontSize:12, fontWeight:600, color:'#4a5568' }}>Mentorado</label>
                <select style={{ ...s.input, marginTop:4, background:'#fff' }} value={agendarData.solicitudId} onChange={e=>setAgendarData({...agendarData,solicitudId:e.target.value})}>
                  <option value="">Seleccionar mentorado</option>
                  {aceptadas.map(s=><option key={s.id_solicitud} value={s.id_solicitud}>{s.nombres} {s.apellidos}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize:12, fontWeight:600, color:'#4a5568' }}>Fecha y Hora</label>
                <input type="datetime-local" style={{ ...s.input, marginTop:4 }} value={agendarData.fecha_hora} onChange={e=>setAgendarData({...agendarData,fecha_hora:e.target.value})} /></div>
              <div><label style={{ fontSize:12, fontWeight:600, color:'#4a5568' }}>Modalidad</label>
                <select style={{ ...s.input, marginTop:4, background:'#fff' }} value={agendarData.modalidad} onChange={e=>setAgendarData({...agendarData,modalidad:e.target.value})}>
                  {['virtual','presencial'].map(m=><option key={m}>{m}</option>)}
                </select></div>
              <div><label style={{ fontSize:12, fontWeight:600, color:'#4a5568' }}>Enlace virtual</label>
                <input style={{ ...s.input, marginTop:4 }} placeholder="https://meet.google.com/..." value={agendarData.enlace_virtual} onChange={e=>setAgendarData({...agendarData,enlace_virtual:e.target.value})} /></div>
            </div>
            <button style={{ ...s.btn('#553c9a'), marginTop:16, padding:'10px 24px' }} onClick={agendar}>📅 Agendar Sesión</button>
          </div>
        )}

        {/* Sesiones */}
        {sesiones.length > 0 && (
          <div style={s.card}>
            <h3 style={{ fontSize:15, fontWeight:700, color:'#1a365d', marginBottom:16 }}>Mis Sesiones</h3>
            {sesiones.map(se => (
              <div key={se.id_sesion} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #f0f4f8', paddingBottom:12, marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:600, color:'#2d3748', fontSize:14 }}>{new Date(se.fecha_hora).toLocaleString('es-PE')}</div>
                  <div style={{ fontSize:12, color:'#718096' }}>{se.mentorado_nombre} {se.mentorado_apellido} · {se.modalidad} · {se.duracion_min}min</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={s.badge(se.realizada ? '#276749' : '#d69e2e')}>{se.realizada ? 'Realizada' : 'Pendiente'}</span>
                  {!se.realizada && <button style={s.btn('#276749')} onClick={() => completar(se.id_sesion)}>✓ Completar</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
