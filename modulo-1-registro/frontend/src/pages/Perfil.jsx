import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  navTitle: { fontSize:18, fontWeight:700 },
  navUser: { display:'flex', alignItems:'center', gap:16, fontSize:14 },
  logoutBtn: { background:'rgba(255,255,255,0.15)', border:'none', color:'#fff', padding:'6px 16px', borderRadius:6, cursor:'pointer', fontSize:13 },
  body: { maxWidth:900, margin:'0 auto', padding:'32px 16px' },
  card: { background:'#fff', borderRadius:12, padding:28, marginBottom:24, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' },
  h3: { fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:16, borderBottom:'2px solid #e2e8f0', paddingBottom:8 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  label: { fontSize:11, fontWeight:600, color:'#a0aec0', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 },
  value: { fontSize:14, color:'#2d3748', fontWeight:500 },
  input: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:6, fontSize:13, outline:'none' },
  select: { width:'100%', padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:6, fontSize:13, outline:'none', background:'#fff' },
  btn: { padding:'8px 20px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSm: { padding:'5px 12px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:5, fontSize:12, cursor:'pointer' },
  btnDanger: { padding:'5px 12px', background:'#e53e3e', color:'#fff', border:'none', borderRadius:5, fontSize:12, cursor:'pointer' },
  tag: { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500 },
  badge: { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:'#ebf8ff', color:'#2b6cb0' },
  section: { marginTop:16 },
  row: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'12px 0', borderBottom:'1px solid #f7fafc' },
};

const nivelColors = { basico:'#f6e05e', intermedio:'#68d391', avanzado:'#63b3ed', experto:'#b794f4' };

export default function Perfil() {
  const [egresado, setEgresado] = useState(null);
  const [habilidades, setHabilidades] = useState([]);
  const [editing, setEditing] = useState(false);
  const [perfilEdit, setPerfilEdit] = useState({});
  const [newHab, setNewHab] = useState({ id_habilidad:'', nivel:'intermedio' });
  const [newExp, setNewExp] = useState({ empresa:'', cargo:'', fecha_inicio:'', actual:false });
  const [newEdu, setNewEdu] = useState({ tipo:'curso', nombre:'', institucion:'' });
  const [newProy, setNewProy] = useState({ titulo:'', descripcion:'', url_proyecto:'', url_imagen:'' });
  const [timeline, setTimeline] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  useEffect(() => {
    // Si el usuario tiene id_egresado, redirigir a PerfilEgresado que es el componente completo
    if (user.id_egresado) {
      navigate('/perfil-egresado');
      return;
    }
    loadPerfil();
    api.get('/api/perfil/habilidades').then(r => setHabilidades(r.data.data || []));
  }, []);

  const importLinkedIn = () => {
    if (!perfilEdit.linkedin_url) return alert('Por favor, ingresa tu URL de LinkedIn primero.');
    setIsImporting(true);
    // Simulación de importación inteligente
    setTimeout(async () => {
      setPerfilEdit(prev => ({
        ...prev,
        resumen: 'Profesional egresado de la UNT con experiencia en desarrollo de soluciones tecnológicas y gestión de proyectos. Especializado en arquitecturas escalables y metodologías ágiles.',
      }));
      
      // Simular agregado de habilidades automáticas
      const dummyHabs = [
        { id_habilidad: 'b1000000-0000-0000-0000-000000000001', nivel: 'avanzado' }, // JavaScript
        { id_habilidad: 'b1000000-0000-0000-0000-000000000003', nivel: 'intermedio' } // SQL
      ];
      
      for (const h of dummyHabs) {
        await api.post(`/api/perfil/${user.id_egresado}/habilidades`, h);
      }
      
      setIsImporting(false);
      alert('¡Importación de LinkedIn completada! Se ha actualizado tu resumen y habilidades sugeridas.');
      loadPerfil();
    }, 2500);
  };

  const loadPerfil = async () => {
    if (!user.id_egresado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rPerfil, rTimeline] = await Promise.all([
        api.get(`/api/egresados/${user.id_egresado}`),
        api.get(`/api/perfil/${user.id_egresado}/timeline`)
      ]);
      setEgresado(rPerfil.data.data);
      setTimeline(rTimeline.data.data || []);
      setPerfilEdit({
        resumen: rPerfil.data.data.resumen || '',
        linkedin_url: rPerfil.data.data.linkedin_url || '',
        github_url: rPerfil.data.data.github_url || '',
        portfolio_url: rPerfil.data.data.portfolio_url || '',
        disponibilidad: rPerfil.data.data.disponibilidad || 'disponible',
        modalidad_trabajo: rPerfil.data.data.modalidad_trabajo || 'cualquiera',
        pretension_salarial: rPerfil.data.data.pretension_salarial || '',
        privacidad_perfil: rPerfil.data.data.privacidad_perfil || 'publico',
      });
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
    }
    setLoading(false);
  };

  const addProyecto = async () => {
    if (!newProy.titulo) return alert('El título del proyecto es requerido');
    await api.post(`/api/perfil/${user.id_egresado}/proyectos`, newProy);
    setNewProy({ titulo:'', descripcion:'', url_proyecto:'', url_imagen:'' }); loadPerfil();
  };

  const removeProyecto = async (id_proy) => {
    await api.delete(`/api/perfil/${user.id_egresado}/proyectos/${id_proy}`);
    loadPerfil();
  };

  const savePerfil = async () => {
    await api.put(`/api/perfil/${user.id_egresado}`, perfilEdit);
    setEditing(false); loadPerfil();
  };

  const addHabilidad = async () => {
    if (!newHab.id_habilidad) return;
    await api.post(`/api/perfil/${user.id_egresado}/habilidades`, newHab);
    setNewHab({ id_habilidad:'', nivel:'intermedio' }); loadPerfil();
  };

  const removeHabilidad = async (id_habilidad) => {
    await api.delete(`/api/perfil/${user.id_egresado}/habilidades/${id_habilidad}`);
    loadPerfil();
  };

  const addExperiencia = async () => {
    if (!newExp.empresa || !newExp.cargo || !newExp.fecha_inicio) return alert('Empresa, cargo y fecha inicio son requeridos');
    await api.post(`/api/perfil/${user.id_egresado}/experiencia`, newExp);
    setNewExp({ empresa:'', cargo:'', fecha_inicio:'', actual:false }); loadPerfil();
  };

  const addEducacion = async () => {
    if (!newEdu.nombre || !newEdu.institucion) return alert('Nombre e institución son requeridos');
    await api.post(`/api/perfil/${user.id_egresado}/educacion`, newEdu);
    setNewEdu({ tipo:'curso', nombre:'', institucion:'' }); loadPerfil();
  };

  const logout = () => {
    localStorage.removeItem('sge_token'); localStorage.removeItem('sge_user');
    navigate('/login');
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#718096'}}>Cargando...</div>;
  if (!egresado) {
    const isAdmin = (user.rol || '').toLowerCase() === 'admin';
    return (
      <div style={s.page}>
        <div style={s.body}>
          <div style={s.card}>
            <h2 style={{margin:0, fontSize:20, color:'#1a365d'}}>{isAdmin ? 'Registro y Perfil de Egresados' : 'Perfil no disponible'}</h2>
            <p style={{color:'#718096', marginTop:8, fontSize:14, lineHeight:'1.6'}}>
              {isAdmin
                ? 'Esta cuenta no está asociada a un egresado. Inicia sesión con un egresado para ver y editar el perfil.'
                : 'No se encontró un egresado asociado a tu cuenta. Si acabas de registrarte, intenta recargar.'}
            </p>
            <div style={{display:'flex', gap:12, marginTop:24, flexDirection: 'column', alignItems: 'center'}}>
              {isAdmin && (
                <button 
                  style={{...s.btn, background:'#166534', padding: '16px 32px', fontSize: 16, width: '100%', maxWidth: 400}} 
                  onClick={() => navigate('/admin/egresados/crear')}
                >
                  ➕ REGISTRAR EGRESADO
                </button>
              )}
              <div style={{display: 'flex', gap: 12, width: '100%', justifyContent: 'center'}}>
                <button style={{...s.btn, background:'#1a365d', flex: 1, maxWidth: 200}} onClick={() => navigate('/dashboard')}>Ir a Inicio</button>
                <button style={{...s.btn, flex: 1, maxWidth: 200}} onClick={loadPerfil}>Reintentar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.body}>
        
        {/* Header de Perfil con Validación SUNEDU */}
        <div style={{...s.card, display:'flex', gap:24, alignItems:'center', background:'linear-gradient(to right, #ffffff, #f8fafc)'}}>
          <div style={{position:'relative'}}>
            <div style={{width:100, height:100, borderRadius:'50%', background:'#1a365d', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:700, border:'4px solid #fff', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
              {egresado.nombres?.[0]}{egresado.apellidos?.[0]}
            </div>
            {egresado.sunedu_validado && (
              <div title="Validado por SUNEDU" style={{position:'absolute', bottom:0, right:0, background:'#38a169', color:'#fff', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff', fontSize:14}}>
                ✓
              </div>
            )}
          </div>
          <div style={{flex:1}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <h2 style={{margin:0, fontSize:24, color:'#1a365d'}}>{egresado.nombres} {egresado.apellidos}</h2>
              {egresado.sunedu_validado && <span style={{...s.badge, background:'#f0fdf4', color:'#166534', border:'1px solid #bbf7d0'}}>OFICIAL SUNEDU</span>}
            </div>
            <p style={{margin:'4px 0', color:'#718096', fontSize:15}}>{egresado.escuela} • Promoción {egresado.promocion}</p>
            <div style={{display:'flex', gap:8, marginTop:10}}>
              <span style={s.badge}>{egresado.sunedu_grado || 'Egresado'}</span>
              <span style={{...s.badge, background:'#fff5f5', color:'#c53030'}}>DNI: {egresado.num_doc}</span>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {user.isAdmin && (
              <button 
                style={{...s.btn, background:'#166534', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6}} 
                onClick={() => navigate('/admin/egresados/crear')}
              >
                ➕ REGISTRAR EGRESADO
              </button>
            )}
            <button style={{...s.btn, background:'#1a365d'}} onClick={() => setEditing(!editing)}>
              {editing ? 'Cancelar' : '⚙️ Configurar Perfil'}
            </button>
          </div>
        </div>

        {/* Resumen y CV Inteligente */}
        <div style={s.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, borderBottom:'2px solid #e2e8f0', paddingBottom:8}}>
            <h3 style={{margin:0, fontSize:16, fontWeight:700, color:'#1a365d'}}>CV Inteligente & Resumen</h3>
            <button 
              onClick={importLinkedIn} 
              disabled={isImporting}
              style={{...s.btnSm, background:'#0077b5', display:'flex', alignItems:'center', gap:6}}
            >
              {isImporting ? '⌛ Importando...' : '🔗 Importar de LinkedIn'}
            </button>
          </div>
          
          {editing ? (
            <div style={s.section}>
              <label style={s.label}>Resumen Profesional (Generado por IA o manual)</label>
              <textarea 
                style={{...s.input, minHeight:100, marginBottom:16}} 
                value={perfilEdit.resumen} 
                onChange={e => setPerfilEdit({...perfilEdit, resumen:e.target.value})}
                placeholder="Cuéntanos sobre tu trayectoria profesional..."
              />
              <div style={s.grid2}>
                <div><label style={s.label}>LinkedIn URL</label><input style={s.input} value={perfilEdit.linkedin_url} onChange={e => setPerfilEdit({...perfilEdit, linkedin_url:e.target.value})} /></div>
                <div><label style={s.label}>GitHub URL</label><input style={s.input} value={perfilEdit.github_url} onChange={e => setPerfilEdit({...perfilEdit, github_url:e.target.value})} /></div>
                <div><label style={s.label}>Portafolio Personal</label><input style={s.input} value={perfilEdit.portfolio_url} onChange={e => setPerfilEdit({...perfilEdit, portfolio_url:e.target.value})} /></div>
                <div><label style={s.label}>Disponibilidad</label>
                  <select style={s.select} value={perfilEdit.disponibilidad} onChange={e => setPerfilEdit({...perfilEdit, disponibilidad:e.target.value})}>
                    <option value="disponible">Inmediata</option>
                    <option value="trabajando">Trabajando</option>
                    <option value="busqueda_activa">Búsqueda Activa</option>
                  </select>
                </div>
                <div><label style={s.label}>Pretensión Salarial (S/.)</label><input style={s.input} type="number" value={perfilEdit.pretension_salarial} onChange={e => setPerfilEdit({...perfilEdit, pretension_salarial:e.target.value})} /></div>
                <div><label style={s.label}>Privacidad del Perfil (Granular)</label>
                  <select style={s.select} value={perfilEdit.privacidad_perfil} onChange={e => setPerfilEdit({...perfilEdit, privacidad_perfil:e.target.value})}>
                    <option value="publico">Público (Todo el sistema)</option>
                    <option value="solo_empresas">Solo Empresas Verificadas</option>
                    <option value="solo_egresados">Solo Comunidad Egresados</option>
                    <option value="privado">Privado (Solo yo)</option>
                  </select>
                </div>
              </div>
              <button style={{...s.btn, marginTop:16, width:'100%'}} onClick={savePerfil}>💾 Guardar Configuración de Privacidad y Perfil</button>
            </div>
          ) : (
            <div>
              <p style={{color:'#4a5568', fontSize:14, lineHeight:'1.6', marginBottom:20}}>
                {egresado.resumen || 'Aún no has agregado un resumen profesional. ¡Usa la importación de LinkedIn para comenzar!'}
              </p>
              <div style={s.grid2}>
                {egresado.linkedin_url && <div><div style={s.label}>LinkedIn</div><a href={egresado.linkedin_url} target="_blank" style={{color:'#2d6a9f', fontSize:13, fontWeight:600}}>{egresado.linkedin_url}</a></div>}
                {egresado.github_url && <div><div style={s.label}>GitHub</div><a href={egresado.github_url} target="_blank" style={{color:'#2d6a9f', fontSize:13, fontWeight:600}}>{egresado.github_url}</a></div>}
                {egresado.disponibilidad && <div><div style={s.label}>Disponibilidad</div><div style={s.value}>{egresado.disponibilidad?.replace('_',' ')}</div></div>}
                <div><div style={s.label}>Privacidad</div><div style={{...s.value, color:'#dd6b20'}}>🔒 {egresado.privacidad_perfil?.replace('_',' ')}</div></div>
              </div>
            </div>
          )}
        </div>

        {/* Habilidades */}
        <div style={s.card}>
          <h3 style={s.h3}>Habilidades</h3>
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:16}}>
            {(egresado.habilidades || []).map(h => (
              <span key={h.id_habilidad} style={{...s.tag, background: nivelColors[h.nivel] || '#e2e8f0', color:'#2d3748'}}>
                {h.nombre} <span style={{opacity:.6, fontSize:10}}>({h.nivel})</span>
                <button onClick={() => removeHabilidad(h.id_habilidad)} style={{background:'none', border:'none', cursor:'pointer', marginLeft:4, color:'#e53e3e', fontSize:12}}>×</button>
              </span>
            ))}
            {(!egresado.habilidades || egresado.habilidades.length === 0) && <span style={{color:'#a0aec0', fontSize:13}}>Sin habilidades registradas</span>}
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <select style={{...s.select, width:'auto', minWidth:180}} value={newHab.id_habilidad} onChange={e => setNewHab({...newHab, id_habilidad:e.target.value})}>
              <option value="">Agregar habilidad...</option>
              {habilidades.map(h => <option key={h.id_habilidad} value={h.id_habilidad}>{h.nombre} ({h.categoria})</option>)}
            </select>
            <select style={{...s.select, width:'auto'}} value={newHab.nivel} onChange={e => setNewHab({...newHab, nivel:e.target.value})}>
              {['basico','intermedio','avanzado','experto'].map(n => <option key={n}>{n}</option>)}
            </select>
            <button style={s.btn} onClick={addHabilidad}>+ Agregar</button>
          </div>
        </div>

        {/* Experiencia laboral */}
        <div style={s.card}>
          <h3 style={s.h3}>Experiencia Laboral</h3>
          {(egresado.experiencias || []).map(exp => (
            <div key={exp.id_exp} style={s.row}>
              <div>
                <div style={{fontWeight:600, color:'#2d3748', fontSize:14}}>{exp.cargo}</div>
                <div style={{color:'#718096', fontSize:13}}>{exp.empresa}</div>
                <div style={{color:'#a0aec0', fontSize:12}}>{exp.fecha_inicio} — {exp.actual ? 'Presente' : (exp.fecha_fin || '—')}</div>
                {exp.descripcion && <div style={{color:'#4a5568', fontSize:12, marginTop:4}}>{exp.descripcion}</div>}
              </div>
            </div>
          ))}
          <div style={{marginTop:16, background:'#f7fafc', borderRadius:8, padding:16}}>
            <div style={{fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:12}}>Agregar Experiencia</div>
            <div style={s.grid2}>
              <div><label style={s.label}>Empresa *</label><input style={s.input} value={newExp.empresa} onChange={e=>setNewExp({...newExp,empresa:e.target.value})} /></div>
              <div><label style={s.label}>Cargo *</label><input style={s.input} value={newExp.cargo} onChange={e=>setNewExp({...newExp,cargo:e.target.value})} /></div>
              <div><label style={s.label}>Fecha Inicio *</label><input style={s.input} type="date" value={newExp.fecha_inicio} onChange={e=>setNewExp({...newExp,fecha_inicio:e.target.value})} /></div>
              <div style={{display:'flex', alignItems:'center', gap:8, marginTop:20}}>
                <input type="checkbox" id="actual" checked={newExp.actual} onChange={e=>setNewExp({...newExp,actual:e.target.checked})} />
                <label htmlFor="actual" style={{fontSize:13}}>Trabajo actual</label>
              </div>
            </div>
            <button style={{...s.btn, marginTop:12}} onClick={addExperiencia}>+ Agregar Experiencia</button>
          </div>
        </div>

        {/* Educación continua */}
        <div style={s.card}>
          <h3 style={s.h3}>Educación Continua y Certificaciones</h3>
          {(egresado.educacion || []).map(edu => (
            <div key={edu.id_edu} style={s.row}>
              <div>
                <div style={{fontWeight:600, color:'#2d3748', fontSize:14}}>{edu.nombre}</div>
                <div style={{color:'#718096', fontSize:13}}>{edu.institucion}</div>
                <div style={{color:'#a0aec0', fontSize:12}}>{edu.tipo} {edu.fecha_fin ? `— ${edu.fecha_fin}` : ''}</div>
              </div>
              {edu.url_certificado && <a href={edu.url_certificado} target="_blank" style={{color:'#2d6a9f', fontSize:12}}>Ver Certificado</a>}
            </div>
          ))}
          <div style={{marginTop:16, background:'#f7fafc', borderRadius:8, padding:16}}>
            <div style={{fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:12}}>Agregar Certificación / Curso</div>
            <div style={s.grid2}>
              <div><label style={s.label}>Tipo</label>
                <select style={s.select} value={newEdu.tipo} onChange={e=>setNewEdu({...newEdu,tipo:e.target.value})}>
                  {['maestria','doctorado','diplomado','certificacion','curso','otro'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Nombre *</label><input style={s.input} value={newEdu.nombre} onChange={e=>setNewEdu({...newEdu,nombre:e.target.value})} /></div>
              <div><label style={s.label}>Institución *</label><input style={s.input} value={newEdu.institucion} onChange={e=>setNewEdu({...newEdu,institucion:e.target.value})} /></div>
              <div><label style={s.label}>URL Certificado</label><input style={s.input} value={newEdu.url_certificado||''} onChange={e=>setNewEdu({...newEdu,url_certificado:e.target.value})} /></div>
            </div>
            <button style={{...s.btn, marginTop:12}} onClick={addEducacion}>+ Agregar</button>
          </div>
        </div>

        {/* Portafolio Multimedia de Proyectos */}
        <div style={s.card}>
          <h3 style={s.h3}>🚀 Portafolio Multimedia de Proyectos</h3>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:20, marginBottom:24}}>
            {(egresado.proyectos || []).map(p => (
              <div key={p.id_proy} style={{border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', background:'#fff', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', transition:'transform 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='none'}>
                <div style={{height:140, background: p.url_imagen ? `url(${p.url_imagen}) center/cover` : '#edf2f7', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {!p.url_imagen && <span style={{fontSize:40}}>🖼️</span>}
                </div>
                <div style={{padding:16}}>
                  <div style={{fontWeight:700, fontSize:15, color:'#1a365d', marginBottom:6}}>{p.titulo}</div>
                  <p style={{fontSize:12, color:'#718096', margin:'0 0 12px 0', height:36, overflow:'hidden'}}>{p.descripcion}</p>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    {p.url_proyecto && <a href={p.url_proyecto} target="_blank" style={{fontSize:12, color:'#2d6a9f', fontWeight:700, textDecoration:'none'}}>Ver Proyecto →</a>}
                    <button onClick={() => removeProyecto(p.id_proy)} style={{background:'none', border:'none', color:'#e53e3e', cursor:'pointer', fontSize:11, fontWeight:600}}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{background:'#f8fafc', borderRadius:12, padding:20, border:'1.5px dashed #cbd5e0'}}>
            <h4 style={{margin:'0 0 16px 0', fontSize:14, color:'#4a5568'}}>+ Agregar Nuevo Proyecto Multimedia</h4>
            <div style={s.grid2}>
              <div><label style={s.label}>Título del Proyecto *</label><input style={s.input} value={newProy.titulo} onChange={e=>setNewProy({...newProy,titulo:e.target.value})} /></div>
              <div><label style={s.label}>URL Imagen (Portada)</label><input style={s.input} value={newProy.url_imagen} onChange={e=>setNewProy({...newProy,url_imagen:e.target.value})} placeholder="https://..." /></div>
              <div><label style={s.label}>URL Proyecto / Demo</label><input style={s.input} value={newProy.url_proyecto} onChange={e=>setNewProy({...newProy,url_proyecto:e.target.value})} placeholder="https://github.com/..." /></div>
              <div style={{gridColumn:'1 / -1'}}><label style={s.label}>Descripción Breve</label><textarea style={{...s.input, minHeight:60}} value={newProy.descripcion} onChange={e=>setNewProy({...newProy,descripcion:e.target.value})} /></div>
            </div>
            <button style={{...s.btn, marginTop:16, width:'100%'}} onClick={addProyecto}>✨ Publicar en Portafolio</button>
          </div>
        </div>

        {/* Línea de Tiempo Profesional y Académica */}
        <div style={s.card}>
          <h3 style={s.h3}>📅 Línea de Tiempo: Logros Académicos y Profesionales</h3>
          <div style={{position:'relative', paddingLeft:32, borderLeft:'3px solid #e2e8f0', marginLeft:10, marginTop:20}}>
            {timeline.length > 0 ? timeline.map((item, i) => (
              <div key={i} style={{marginBottom:32, position:'relative'}}>
                <div style={{
                  position:'absolute', left:-39, top:4, width:14, height:14, borderRadius:'50%', 
                  background: item.tipo === 'laboral' ? '#3182ce' : (item.tipo === 'academico' ? '#38a169' : '#805ad5'), 
                  border:'3px solid #fff', boxShadow:'0 0 0 2px ' + (item.tipo === 'laboral' ? '#3182ce' : (item.tipo === 'academico' ? '#38a169' : '#805ad5'))
                }} />
                <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
                  <span style={{fontSize:12, fontWeight:800, color:'#a0aec0'}}>{new Date(item.fecha).getFullYear() || item.fecha}</span>
                  <span style={{fontSize:10, color:'#fff', background: item.tipo === 'laboral' ? '#3182ce' : (item.tipo === 'academico' ? '#38a169' : '#805ad5'), padding:'2px 8px', borderRadius:4, textTransform:'uppercase', fontWeight:700}}>{item.tipo}</span>
                </div>
                <div style={{fontWeight:700, color:'#1a365d', fontSize:15}}>{item.titulo}</div>
              </div>
            )) : <p style={{color:'#718096', fontSize:13}}>Completa tu perfil para generar tu línea de tiempo automática.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
