import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const s = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a365d 0%,#2d6a9f 100%)', padding:20 },
  card: { background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  h2: { fontSize:22, fontWeight:700, color:'#1a365d', marginBottom:4 },
  sub: { color:'#718096', fontSize:13, marginBottom:24 },
  steps: { display:'flex', gap:8, marginBottom:32 },
  step: { flex:1, height:6, borderRadius:3 },
  label: { display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginBottom:5, marginTop:14 },
  input: { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none' },
  select: { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, outline:'none', background:'#fff' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  btn: { padding:'11px 24px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  btnOutline: { padding:'11px 24px', background:'transparent', color:'#2d6a9f', border:'1.5px solid #2d6a9f', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  error: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13 },
  footer: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:28 },
};

const STEPS = ['Datos Personales', 'Datos Académicos', 'Acceso'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [suneduInfo, setSuneduInfo] = useState(null);
  const [escuelas, setEscuelas] = useState([]);
  const [err, setErr] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    tipo_doc:'DNI', num_doc:'', nombres:'', apellidos:'', email:'', telefono:'',
    codigo_universitario:'', id_escuela:'', promocion:'', anio_ingreso:'', anio_egreso:'', anio_titulacion:'', promedio:'',
    username:'', password:'', password2:'',
  });

  useEffect(() => {
    // Fetch escuelas sin auth (endpoint público)
    api.get('/api/perfil/escuelas')
      .then(d => setEscuelas(d.data.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const validateSunedu = async () => {
    if (!form.codigo_universitario || !form.num_doc) return setErr('Código y documento son necesarios para validar SUNEDU');
    setIsValidating(true);
    setErr('');
    // Simular delay de API SUNEDU
    setTimeout(() => {
      if (form.codigo_universitario.length >= 8 && form.num_doc.length >= 8) {
        setSuneduInfo({ success: true, grado: 'Bachiller', fecha: '2023-12-15' });
        setStep(2);
      } else {
        setErr('No se encontró información en SUNEDU para los datos proporcionados.');
      }
      setIsValidating(false);
    }, 2000);
  };

  const next = (e) => {
    e.preventDefault(); setErr('');
    if (step === 0) {
      if (!form.nombres || !form.apellidos || !form.email || !form.num_doc) return setErr('Complete todos los campos requeridos');
      setStep(1);
    } else if (step === 1) {
      validateSunedu();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    if (form.password !== form.password2) return setErr('Las contraseñas no coinciden');
    if (form.password.length < 6) return setErr('La contraseña debe tener al menos 6 caracteres');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (e) { setErr(e.message); }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        {isValidating ? (
          <div style={{textAlign:'center', padding:'40px 0'}}>
            <div style={{fontSize:48, animation:'spin 2s linear infinite'}}>📡</div>
            <h3 style={{marginTop:20, color:'#1a365d'}}>Validando con SUNEDU...</h3>
            <p style={{color:'#718096', fontSize:14}}>Estamos verificando tus grados y títulos registrados de forma automática.</p>
            <style>{`@keyframes spin { from {transform:rotate(0deg);} to {transform:rotate(360deg);} }`}</style>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center', marginBottom:24}}>
              <span style={{fontSize:36}}>🎓</span>
              <h2 style={s.h2}>Registro de Egresado</h2>
              <p style={s.sub}>Paso {step + 1} de {STEPS.length}: {STEPS[step]}</p>
            </div>
            <div style={s.steps}>
              {STEPS.map((_, i) => (
                <div key={i} style={{...s.step, background: i <= step ? '#2d6a9f' : '#e2e8f0'}} />
              ))}
            </div>

            {step === 0 && (
              <form onSubmit={next}>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Tipo Doc</label>
                    <select style={s.select} value={form.tipo_doc} onChange={e=>set('tipo_doc',e.target.value)}>
                      <option value="DNI">DNI</option>
                      <option value="CARNET_EXT">Carnet Ext.</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Nº Documento *</label>
                    <input style={s.input} value={form.num_doc} onChange={e=>set('num_doc',e.target.value)} maxLength={20} required />
                  </div>
                </div>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Nombres *</label>
                    <input style={s.input} value={form.nombres} onChange={e=>set('nombres',e.target.value)} required />
                  </div>
                  <div>
                    <label style={s.label}>Apellidos *</label>
                    <input style={s.input} value={form.apellidos} onChange={e=>set('apellidos',e.target.value)} required />
                  </div>
                </div>
                <label style={s.label}>Email *</label>
                <input style={s.input} type="email" value={form.email} onChange={e=>set('email',e.target.value)} required />
                <label style={s.label}>Teléfono</label>
                <input style={s.input} value={form.telefono} onChange={e=>set('telefono',e.target.value)} />
                {err && <div style={s.error}>⚠️ {err}</div>}
                <div style={s.footer}>
                  <Link to="/login" style={{color:'#718096', fontSize:13}}>← Volver al login</Link>
                  <button style={s.btn} type="submit">Siguiente →</button>
                </div>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={next}>
                <label style={s.label}>Código Universitario *</label>
                <input style={s.input} value={form.codigo_universitario} onChange={e=>set('codigo_universitario',e.target.value)} required />
                <label style={s.label}>Escuela Profesional *</label>
                <select style={s.select} value={form.id_escuela} onChange={e=>set('id_escuela',e.target.value)} required>
                  <option value="">-- Seleccione --</option>
                  {escuelas.map(esc => (
                    <option key={esc.id_escuela} value={esc.id_escuela}>{esc.facultad} - {esc.nombre}</option>
                  ))}
                </select>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Año Ingreso</label>
                    <input style={s.input} type="number" value={form.anio_ingreso} onChange={e=>set('anio_ingreso',e.target.value)} min={1950} max={2030} />
                  </div>
                  <div>
                    <label style={s.label}>Año Egreso</label>
                    <input style={s.input} type="number" value={form.anio_egreso} onChange={e=>set('anio_egreso',e.target.value)} min={1950} max={2030} />
                  </div>
                </div>
                <div style={s.row}>
                  <div>
                    <label style={s.label}>Año Titulación</label>
                    <input style={s.input} type="number" value={form.anio_titulacion} onChange={e=>set('anio_titulacion',e.target.value)} min={1950} max={2030} />
                  </div>
                  <div>
                    <label style={s.label}>Promedio (0-20)</label>
                    <input style={s.input} type="number" value={form.promedio} onChange={e=>set('promedio',e.target.value)} min={0} max={20} step={0.01} />
                  </div>
                </div>
                <label style={s.label}>Promoción</label>
                <input style={s.input} value={form.promocion} onChange={e=>set('promocion',e.target.value)} placeholder="Ej: 2020-I" />
                {err && <div style={s.error}>⚠️ {err}</div>}
                <div style={s.footer}>
                  <button style={s.btnOutline} type="button" onClick={() => setStep(0)}>← Atrás</button>
                  <button style={s.btn} type="submit">Validar SUNEDU →</button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit}>
                <div style={{background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:16, marginBottom:24}}>
                  <div style={{fontSize:13, color:'#166534', fontWeight:700}}>✅ Validación Exitosa</div>
                  <div style={{fontSize:12, color:'#166534'}}>Grado detectado: <strong>{suneduInfo.grado}</strong></div>
                  <div style={{fontSize:11, color:'#166534', opacity:0.8}}>Fecha de registro: {suneduInfo.fecha}</div>
                </div>
                <label style={s.label}>Nombre de usuario</label>
                <input style={s.input} value={form.username} onChange={e=>set('username',e.target.value)} placeholder="Dejar en blanco para usar email" />
                <label style={s.label}>Contraseña *</label>
                <input style={s.input} type="password" value={form.password} onChange={e=>set('password',e.target.value)} required />
                <label style={s.label}>Confirmar Contraseña *</label>
                <input style={s.input} type="password" value={form.password2} onChange={e=>set('password2',e.target.value)} required />
                {err && <div style={s.error}>⚠️ {err}</div>}
                <div style={s.footer}>
                  <button style={s.btnOutline} type="button" onClick={() => setStep(1)}>← Atrás</button>
                  <button style={s.btn} type="submit" disabled={loading}>{loading ? 'Registrando...' : '✓ Registrarse'}</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
