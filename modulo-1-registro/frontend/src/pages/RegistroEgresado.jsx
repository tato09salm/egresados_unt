import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const s = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a365d 0%,#2d6a9f 100%)', padding:20 },
  card: { background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:700, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  h2: { fontSize:22, fontWeight:700, color:'#1a365d', marginBottom:4 },
  sub: { color:'#718096', fontSize:13, marginBottom:24 },
  steps: { display:'flex', gap:8, marginBottom:32 },
  step: { flex:1, height:6, borderRadius:3 },
  label: { display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:5, marginTop:14 },
  input: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none' },
  select: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', background:'#fff' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  btn: { padding:'12px 28px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'12px 28px', background:'transparent', color:'#2d6a9f', border:'1.5px solid #2d6a9f', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  error: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'12px 16px', marginTop:16, fontSize:13 },
  footer: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:32 },
  summaryItem: { marginBottom: 12, fontSize: 14, borderBottom: '1px solid #f7fafc', paddingBottom: 8 },
  summaryLabel: { fontWeight: 700, color: '#4a5568', width: 150, display: 'inline-block' }
};

const STEPS = ['Datos Personales', 'Credenciales', 'Datos Académicos', 'Confirmación'];

export default function RegistroEgresado() {
  const [step, setStep] = useState(0);
  const [escuelas, setEscuelas] = useState([]);
  const [err, setErr] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    // Datos Personales
    tipo_doc:'DNI', num_doc:'', nombres:'', apellidos:'', email:'', telefono:'', direccion:'',
    // Credenciales
    username:'', password:'', password2:'',
    // Datos Académicos
    codigo_universitario:'', id_escuela:'', promocion:'', anio_ingreso:'', anio_egreso:''
  });

  useEffect(() => {
    api.get('/api/perfil/escuelas')
      .then(d => setEscuelas(d.data.data || []))
      .catch(e => console.error('Error fetching escuelas:', e));
  }, []);

  const handleChange = (k, v) => setForm(f => ({...f, [k]: v}));

  const validateStep = () => {
    if (step === 0) {
      if (!form.nombres || !form.apellidos || !form.email || !form.num_doc) return 'Complete todos los campos obligatorios.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email inválido.';
    } else if (step === 1) {
      if (!form.username || !form.password || !form.password2) return 'Complete las credenciales.';
      if (form.password !== form.password2) return 'Las contraseñas no coinciden.';
      if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    } else if (step === 2) {
      if (!form.codigo_universitario || !form.id_escuela) return 'Código universitario y escuela son obligatorios.';
    }
    return null;
  };

  const nextStep = (e) => {
    e.preventDefault();
    const errorMsg = validateStep();
    if (errorMsg) return setErr(errorMsg);
    setErr('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setErr('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await register(form);
      alert('¡Registro exitoso!');
      navigate('/perfil-egresado');
    } catch (e) {
      setErr(e.message);
    }
  };

  const getEscuelaNombre = (id) => {
    const esc = escuelas.find(e => e.id_escuela === id);
    return esc ? `${esc.facultad} - ${esc.nombre}` : 'No seleccionada';
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <div style={{textAlign:'center', marginBottom:24}}>
          <span style={{fontSize:40}}>🎓</span>
          <h2 style={s.h2}>Registro de Egresado UNT</h2>
          <p style={s.sub}>Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
        </div>

        <div style={s.steps}>
          {STEPS.map((_, i) => (
            <div key={i} style={{...s.step, background: i <= step ? '#2d6a9f' : '#e2e8f0'}} />
          ))}
        </div>

        {step === 0 && (
          <form onSubmit={nextStep}>
            <div style={s.row}>
              <div>
                <label style={s.label}>Tipo de Documento *</label>
                <select style={s.select} value={form.tipo_doc} onChange={e=>handleChange('tipo_doc', e.target.value)}>
                  <option value="DNI">DNI</option>
                  <option value="CARNET_EXT">Carnet Extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Nº Documento *</label>
                <input style={s.input} value={form.num_doc} onChange={e=>handleChange('num_doc', e.target.value)} required />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Nombres *</label>
                <input style={s.input} value={form.nombres} onChange={e=>handleChange('nombres', e.target.value)} required />
              </div>
              <div>
                <label style={s.label}>Apellidos *</label>
                <input style={s.input} value={form.apellidos} onChange={e=>handleChange('apellidos', e.target.value)} required />
              </div>
            </div>
            <label style={s.label}>Correo Electrónico *</label>
            <input style={s.input} type="email" value={form.email} onChange={e=>handleChange('email', e.target.value)} required />
            
            <div style={s.row}>
              <div>
                <label style={s.label}>Teléfono</label>
                <input style={s.input} value={form.telefono} onChange={e=>handleChange('telefono', e.target.value)} placeholder="Ej: 987654321" />
              </div>
              <div>
                <label style={s.label}>Dirección</label>
                <input style={s.input} value={form.direccion} onChange={e=>handleChange('direccion', e.target.value)} />
              </div>
            </div>
            
            {err && <div style={s.error}>⚠️ {err}</div>}
            
            <div style={s.footer}>
              <Link to="/login" style={{color:'#718096', fontSize:13}}>Ya tengo cuenta</Link>
              <button style={s.btn} type="submit">Siguiente →</button>
            </div>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={nextStep}>
            <label style={s.label}>Nombre de usuario *</label>
            <input style={s.input} value={form.username} onChange={e=>handleChange('username', e.target.value)} required placeholder="Ej: juan_perez" />
            
            <div style={s.row}>
              <div>
                <label style={s.label}>Contraseña *</label>
                <input style={s.input} type="password" value={form.password} onChange={e=>handleChange('password', e.target.value)} required />
              </div>
              <div>
                <label style={s.label}>Confirmar Contraseña *</label>
                <input style={s.input} type="password" value={form.password2} onChange={e=>handleChange('password2', e.target.value)} required />
              </div>
            </div>

            {err && <div style={s.error}>⚠️ {err}</div>}

            <div style={s.footer}>
              <button style={s.btnOutline} type="button" onClick={prevStep}>← Atrás</button>
              <button style={s.btn} type="submit">Siguiente →</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={nextStep}>
            <label style={s.label}>Código Universitario *</label>
            <input style={s.input} value={form.codigo_universitario} onChange={e=>handleChange('codigo_universitario', e.target.value)} required />
            
            <label style={s.label}>Escuela Profesional *</label>
            <select style={s.select} value={form.id_escuela} onChange={e=>handleChange('id_escuela', e.target.value)} required>
              <option value="">-- Seleccionar Escuela --</option>
              {escuelas.map(esc => (
                <option key={esc.id_escuela} value={esc.id_escuela}>{esc.facultad} - {esc.nombre}</option>
              ))}
            </select>

            <div style={s.row}>
              <div>
                <label style={s.label}>Año de Ingreso</label>
                <input style={s.input} type="number" value={form.anio_ingreso} onChange={e=>handleChange('anio_ingreso', e.target.value)} min={1950} />
              </div>
              <div>
                <label style={s.label}>Año de Egreso</label>
                <input style={s.input} type="number" value={form.anio_egreso} onChange={e=>handleChange('anio_egreso', e.target.value)} min={1950} />
              </div>
            </div>

            <label style={s.label}>Promoción</label>
            <input style={s.input} value={form.promocion} onChange={e=>handleChange('promocion', e.target.value)} placeholder="Ej: 2020-II" />
            
            {err && <div style={s.error}>⚠️ {err}</div>}

            <div style={s.footer}>
              <button style={s.btnOutline} type="button" onClick={prevStep}>← Atrás</button>
              <button style={s.btn} type="submit">Siguiente →</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit}>
            <div style={{background:'#f8fafc', padding:24, borderRadius:12, marginBottom:24}}>
              <h3 style={{marginTop:0, marginBottom:16, fontSize:16, color:'#2d6a9f'}}>Resumen de Registro</h3>
              
              <div style={s.summaryItem}><span style={s.summaryLabel}>Nombre:</span> {form.nombres} {form.apellidos}</div>
              <div style={s.summaryItem}><span style={s.summaryLabel}>Email:</span> {form.email}</div>
              <div style={s.summaryItem}><span style={s.summaryLabel}>Usuario:</span> {form.username}</div>
              <div style={s.summaryItem}><span style={s.summaryLabel}>Escuela:</span> {getEscuelaNombre(form.id_escuela)}</div>
              <div style={s.summaryItem}><span style={s.summaryLabel}>Código:</span> {form.codigo_universitario}</div>
              <div style={s.summaryItem}><span style={s.summaryLabel}>Promoción:</span> {form.promocion || 'No especificada'}</div>
            </div>

            {err && <div style={s.error}>⚠️ {err}</div>}

            <div style={s.footer}>
              <button style={s.btnOutline} type="button" onClick={prevStep}>← Atrás</button>
              <button style={{...s.btn, background:'#166534'}} type="submit" disabled={loading}>
                {loading ? 'Procesando...' : '¡REGISTRARSE AHORA!'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
