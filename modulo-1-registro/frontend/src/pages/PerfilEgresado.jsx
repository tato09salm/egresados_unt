import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import adminService from '../services/admin';
import FotoPerfil from '../components/perfil/FotoPerfil';
import Habilidades from '../components/perfil/Habilidades';
import Experiencia from '../components/perfil/Experiencia';
import Educacion from '../components/perfil/Educacion';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8', padding: '32px 16px' },
  body: { maxWidth:1000, margin:'0 auto' },
  card: { background:'#fff', borderRadius:16, padding:32, marginBottom:24, boxShadow:'0 4px 12px rgba(0,0,0,0.05)' },
  h2: { fontSize:24, fontWeight:700, color:'#1a365d', margin:0 },
  sub: { color:'#718096', fontSize:15, marginTop:4 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:24, marginTop:24 },
  section: { marginTop:32, borderTop: '1px solid #edf2f7', paddingTop:24 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#2d6a9f', marginBottom:20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize:11, fontWeight:700, color:'#a0aec0', textTransform:'uppercase', letterSpacing:0.5, display:'block', marginBottom:4 },
  value: { fontSize:14, color:'#2d3748', fontWeight:600, padding: '8px 0' },
  badge: { padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:'#ebf8ff', color:'#2b6cb0', border: '1px solid #bee3f8' },
  adminBadge: { padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, background:'#fef2f2', color:'#991b1b', border: '1px solid #fecaca', marginBottom:16, display:'inline-block' },
  input: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', background: '#fff' },
  textarea: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', minHeight:100, resize:'vertical' },
  btn: { padding:'10px 24px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  btnSm: { padding:'6px 12px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' },
  btnDanger: { padding:'10px 24px', background:'#dc2626', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'10px 24px', background:'transparent', color:'#2d6a9f', border:'1.5px solid #2d6a9f', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  nav: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  logout: { color:'#e53e3e', fontSize:13, fontWeight:600, cursor:'pointer', background:'none', border:'none' },
  emptyMsg: { textAlign: 'center', padding: '40px', color: '#718096' }
};

export default function PerfilEgresado() {
  const { id } = useParams();
  const [egresado, setEgresado] = useState(null);
  const [empresaMe, setEmpresaMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  
  const isViewingOwn = !id || id === user.id_egresado;
  const canEdit = isViewingOwn || user.isAdmin;

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Perfil para cuentas empresa: no existe egresado asociado.
      if (user.rol === 'empresa') {
        const me = await api.get('/api/auth/me');
        setEmpresaMe(me.data.data);
        setEgresado(null);
        return;
      }

      // Si no hay ID en la URL, usamos el endpoint /perfil (del usuario actual)
      // Si hay ID, usamos /egresados/:id
      const endpoint = id ? `/api/egresados/${id}` : `/api/egresados/perfil`;
      const res = await api.get(endpoint);
      const data = res.data.data;
      setEgresado(data);
      setEmpresaMe(null);
      setForm({
        nombres: data.nombres || '',
        apellidos: data.apellidos || '',
        email: data.email || '',
        resumen: data.resumen || '',
        linkedin_url: data.linkedin_url || '',
        github_url: data.github_url || '',
        portfolio_url: data.portfolio_url || '',
        telefono: data.telefono || '',
        direccion: data.direccion || '',
        situacion_laboral: data.situacion_laboral || 'no_especificado',
        disponibilidad: data.disponibilidad || 'disponible',
        modalidad_trabajo: data.modalidad_trabajo || 'cualquiera',
        pretension_salarial: data.pretension_salarial || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      const msg = err.response?.data?.message || 'Error al cargar el perfil. Por favor, intente de nuevo.';
      setErrorMsg(msg);
      
      if (err.response?.status === 404 && !id && user.isAdmin) {
        navigate('/admin/usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const targetId = id || egresado.id_egresado;
      
      // 1. Actualizar datos de persona y egresado (situacion_laboral)
      await api.put(`/api/egresados/${targetId}`, {
        nombres: form.nombres,
        apellidos: form.apellidos,
        email: form.email,
        telefono: form.telefono,
        direccion: form.direccion,
        situacion_laboral: form.situacion_laboral
      });

      // 2. Actualizar perfil profesional (redes, disponibilidad, modalidad, etc.)
      await api.put(`/api/perfil/${targetId}`, {
        resumen: form.resumen,
        linkedin_url: form.linkedin_url,
        github_url: form.github_url,
        portfolio_url: form.portfolio_url,
        disponibilidad: form.disponibilidad || 'disponible',
        modalidad_trabajo: form.modalidad_trabajo,
        pretension_salarial: form.pretension_salarial
      });

      setEditing(false);
      await loadData(); // Recargar datos para ver cambios reflejados
      alert('¡Perfil actualizado con éxito!');
    } catch (err) {
      console.error('Error al guardar cambios:', err);
      alert('Error al guardar cambios: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return setPassMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
    }
    
    // Validar longitud mínima
    if (passForm.newPassword.length < 6) {
      return setPassMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    try {
      // IMPORTANTE: El backend espera id_usuario en la URL
      await api.put(`/api/usuarios/${user.id_usuario}/cambiar-password`, {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword
      });
      
      setPassMsg({ type: 'success', text: '¡Contraseña actualizada correctamente!' });
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setPassMsg({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error('Error al cambiar contraseña:', err);
      setPassMsg({ 
        type: 'error', 
        text: err.response?.data?.message || 'Error al cambiar la contraseña. Verifique su contraseña actual.' 
      });
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este perfil? El usuario se mantendrá pero perderá su información de egresado.')) return;
    try {
      await adminService.eliminarEgresado(egresado.id_egresado);
      navigate('/admin/usuarios');
    } catch (err) {
      alert('Error al eliminar perfil');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    navigate('/login');
  };

  if (loading) return (
    <div style={{...s.page, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:40, animation:'pulse 1.5s infinite'}}>🎓</div>
        <p style={{color:'#718096', marginTop:16, fontWeight:600}}>Cargando perfil profesional...</p>
        <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
      </div>
    </div>
  );

  // Vista de "Registro y Perfil" para rol empresa
  if (user.rol === 'empresa') {
    return (
      <div style={s.page}>
        <div style={s.body}>
          <div style={s.card}>
            <h2 style={s.h2}>Perfil de Empresa</h2>
            <p style={s.sub}>Información básica de la cuenta de empresa.</p>

            <div style={s.grid}>
              <div>
                <label style={s.label}>Nombre comercial</label>
                <div style={s.value}>{empresaMe?.nombre_comercial || empresaMe?.nombre || '—'}</div>
              </div>
              <div>
                <label style={s.label}>Razón social</label>
                <div style={s.value}>{empresaMe?.razon_social || '—'}</div>
              </div>
              <div>
                <label style={s.label}>Email</label>
                <div style={s.value}>{empresaMe?.email || empresaMe?.username || '—'}</div>
              </div>
              <div>
                <label style={s.label}>Sector</label>
                <div style={s.value}>{empresaMe?.sector || '—'}</div>
              </div>
              <div>
                <label style={s.label}>Último login</label>
                <div style={s.value}>{empresaMe?.ultimo_login ? new Date(empresaMe.ultimo_login).toLocaleString() : '—'}</div>
              </div>
            </div>

            <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={s.btn} onClick={() => navigate('/bolsa/empresa')}>Ir a Bolsa (Empresa)</button>
              <button style={s.btnOutline} onClick={() => navigate('/dashboard')}>Ir al Inicio</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!egresado) return (
    <div style={s.page}>
      <div style={s.body}>
        <div style={s.card}>
          <h2 style={{color:'#1a365d'}}>{errorMsg === 'No se encontró un perfil de egresado asociado a esta cuenta' ? 'Perfil no disponible' : 'Error al cargar perfil'}</h2>
          <p style={{color:'#718096', marginTop:12}}>{errorMsg || 'No se pudo obtener la información de tu perfil.'}</p>
          <div style={{marginTop:24, display:'flex', gap:12}}>
            <button style={s.btn} onClick={() => navigate('/dashboard')}>Ir al Inicio</button>
            <button style={s.btnOutline} onClick={loadData}>Reintentar</button>
            {user.isAdmin && <button style={{...s.btn, background:'#166534'}} onClick={() => navigate('/admin/usuarios')}>Ir a Gestión de Usuarios</button>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.body}>
        <div style={s.nav}>
          <button style={s.btnOutline} onClick={() => navigate(user.isAdmin ? '/admin/usuarios' : '/dashboard')}>
            ← {user.isAdmin ? 'Gestión de Usuarios' : 'Volver al Inicio'}
          </button>
          <div style={{display:'flex', gap:12}}>
            {user.isAdmin && (
              <button style={{...s.btn, background:'#166534'}} onClick={() => navigate('/admin/egresados/crear')}>
                ➕ Registrar Nuevo
              </button>
            )}
            <button style={s.logout} onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        </div>

        {user.isAdmin && id && (
          <div style={s.adminBadge}>🛡️ MODO ADMINISTRADOR - Editando perfil ajeno</div>
        )}

        {/* CABECERA */}
        <div style={s.card}>
          <div style={{display:'flex', gap:32, alignItems:'flex-start', flexWrap: 'wrap'}}>
            <FotoPerfil 
              id_egresado={egresado.id_egresado}
              fotoUrl={egresado.foto_url} 
              nombres={egresado.nombres} 
              apellidos={egresado.apellidos}
              onUpdate={loadData}
            />
            <div style={{flex:1, minWidth: 300}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <h2 style={s.h2}>{egresado.nombres} {egresado.apellidos}</h2>
                  <p style={s.sub}>{egresado.escuela} • {egresado.facultad}</p>
                </div>
                {canEdit && !editing && (
                  <div style={{display:'flex', gap:12}}>
                    {user.isAdmin && !isViewingOwn && (
                      <button style={s.btnDanger} onClick={handleDeleteProfile}>Eliminar</button>
                    )}
                    <button style={s.btn} onClick={() => setEditing(true)}>✏️ Editar Perfil</button>
                  </div>
                )}
              </div>
              <div style={{display:'flex', gap:10, marginTop:16}}>
                <span style={s.badge}>{egresado.sunedu_grado || 'Egresado'}</span>
                <span style={{...s.badge, background:'#f0fdf4', color:'#166534'}}>Promoción {egresado.promocion}</span>
                {egresado.sunedu_validado && <span style={{...s.badge, background:'#fff7ed', color:'#c2410c'}}>✓ Validado SUNEDU</span>}
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Datos Personales y Contacto</h3>
            <div style={s.grid}>
              <div>
                <label style={s.label}>Nombres</label>
                {editing ? <input style={s.input} value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})} /> : <div style={s.value}>{egresado.nombres}</div>}
              </div>
              <div>
                <label style={s.label}>Apellidos</label>
                {editing ? <input style={s.input} value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} /> : <div style={s.value}>{egresado.apellidos}</div>}
              </div>
              <div>
                <label style={s.label}>Email de Contacto</label>
                {editing ? <input style={s.input} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /> : <div style={s.value}>{egresado.email}</div>}
              </div>
              <div>
                <label style={s.label}>Teléfono</label>
                {editing ? <input style={s.input} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} /> : <div style={s.value}>{egresado.telefono || '-'}</div>}
              </div>
              <div>
                <label style={s.label}>Dirección</label>
                {editing ? <input style={s.input} value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} /> : <div style={s.value}>{egresado.direccion || '-'}</div>}
              </div>
              <div>
                <label style={s.label}>Situación Laboral</label>
                {editing ? (
                  <select style={s.input} value={form.situacion_laboral} onChange={e => setForm({...form, situacion_laboral: e.target.value})}>
                    <option value="empleado">Empleado</option>
                    <option value="desempleado">Desempleado</option>
                    <option value="independiente">Independiente</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="no_especificado">No especificado</option>
                  </select>
                ) : <div style={s.value}>{egresado.situacion_laboral}</div>}
              </div>
            </div>
          </div>

          {/* PERFIL PROFESIONAL */}
          <div style={s.section}>
            <h3 style={s.sectionTitle}>Perfil Profesional</h3>
            <div style={{marginBottom: 24}}>
              <label style={s.label}>Resumen Profesional</label>
              {editing ? (
                <textarea 
                  style={s.textarea} 
                  value={form.resumen} 
                  onChange={e => setForm({...form, resumen: e.target.value})}
                  placeholder="Cuenta tu experiencia y objetivos..."
                />
              ) : (
                <p style={{fontSize:14, color:'#4a5568', lineHeight:'1.6', margin:0}}>
                  {egresado.resumen || 'Sin resumen profesional registrado.'}
                </p>
              )}
            </div>
            
            <div style={s.grid}>
              <div>
                <label style={s.label}>LinkedIn</label>
                {editing ? <input style={s.input} value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." /> : 
                  <div style={s.value}>{egresado.linkedin_url ? <a href={egresado.linkedin_url} target="_blank" rel="noreferrer">Ver perfil</a> : '-'}</div>}
              </div>
              <div>
                <label style={s.label}>GitHub / Portfolio</label>
                {editing ? <input style={s.input} value={form.github_url} onChange={e => setForm({...form, github_url: e.target.value})} placeholder="https://github.com/..." /> : 
                  <div style={s.value}>{egresado.github_url ? <a href={egresado.github_url} target="_blank" rel="noreferrer">Ver enlace</a> : '-'}</div>}
              </div>
              <div>
                <label style={s.label}>Disponibilidad</label>
                {editing ? (
                  <select style={s.input} value={form.disponibilidad} onChange={e => setForm({...form, disponibilidad: e.target.value})}>
                    <option value="disponible">Disponible</option>
                    <option value="no_disponible">No disponible</option>
                    <option value="abierto_ofertas">Abierto a ofertas</option>
                  </select>
                ) : <div style={s.value}>{egresado.disponibilidad?.replace(/_/g, ' ')}</div>}
              </div>
              <div>
                <label style={s.label}>Modalidad Preferida</label>
                {editing ? (
                  <select style={s.input} value={form.modalidad_trabajo} onChange={e => setForm({...form, modalidad_trabajo: e.target.value})}>
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                    <option value="cualquiera">Cualquiera</option>
                  </select>
                ) : <div style={s.value}>{egresado.modalidad_trabajo}</div>}
              </div>
              <div>
                <label style={s.label}>Pretensión Salarial (S/.)</label>
                {editing ? <input style={s.input} type="number" value={form.pretension_salarial} onChange={e => setForm({...form, pretension_salarial: e.target.value})} /> : 
                  <div style={s.value}>{egresado.pretension_salarial ? `S/. ${egresado.pretension_salarial}` : '-'}</div>}
              </div>
            </div>
          </div>

          {editing && (
            <div style={{display:'flex', gap:12, marginTop:32, justifyContent:'flex-end'}}>
              <button style={s.btnOutline} onClick={() => setEditing(false)}>Cancelar</button>
              <button style={s.btn} onClick={handleSave}>Guardar Todos los Cambios</button>
            </div>
          )}
        </div>

        {/* HABILIDADES */}
        <div style={s.card}>
          <Habilidades id_egresado={egresado.id_egresado} currentHabs={egresado.habilidades || []} onUpdate={loadData} />
        </div>

        {/* EXPERIENCIA Y EDUCACIÓN */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: 24}}>
          <div style={s.card}>
            <Experiencia id_egresado={egresado.id_egresado} experiencias={egresado.experiencias || []} onUpdate={loadData} />
          </div>
          <div style={s.card}>
            <Educacion id_egresado={egresado.id_egresado} educacion={egresado.educacion || []} onUpdate={loadData} />
          </div>
        </div>

        {/* SEGURIDAD */}
        {isViewingOwn && (
          <div style={s.card}>
            <h3 style={s.sectionTitle}>Seguridad de la Cuenta</h3>
            <form onSubmit={handleChangePassword} style={{maxWidth: 450}}>
              <div style={{display:'grid', gap:12}}>
                <div>
                  <label style={s.label}>Contraseña Actual</label>
                  <input style={s.input} type="password" required value={passForm.oldPassword} onChange={e => setPassForm({...passForm, oldPassword: e.target.value})} />
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                  <div>
                    <label style={s.label}>Nueva Contraseña</label>
                    <input style={s.input} type="password" required value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} />
                  </div>
                  <div>
                    <label style={s.label}>Confirmar Nueva</label>
                    <input style={s.input} type="password" required value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} />
                  </div>
                </div>
              </div>
              
              {passMsg.text && (
                <div style={{
                  padding: '12px', borderRadius: '8px', fontSize: '13px', marginTop: '16px',
                  background: passMsg.type === 'success' ? '#f0fdf4' : '#fff5f5',
                  color: passMsg.type === 'success' ? '#166534' : '#c53030',
                  border: `1px solid ${passMsg.type === 'success' ? '#bbf7d0' : '#feb2b2'}`
                }}>
                  {passMsg.text}
                </div>
              )}

              <button style={{...s.btn, marginTop: 20}} type="submit">Actualizar Contraseña</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
