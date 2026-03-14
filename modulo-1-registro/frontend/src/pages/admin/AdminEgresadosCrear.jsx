import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import adminService from '../../services/admin';

const s = {
  container: { padding: '40px 20px', maxWidth: 900, margin: '0 auto' },
  header: { marginBottom: 32 },
  h2: { margin: 0, color: '#1a365d' },
  card: { background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#2d6a9f', marginBottom: 20, marginTop: 32, borderBottom: '2px solid #e2e8f0', paddingBottom: 8 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6, marginTop: 16 },
  input: { width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
  select: { width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btn: { padding: '14px 28px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 32, width: '100%' },
  btnOutline: { padding: '10px 20px', background: 'transparent', color: '#2d6a9f', border: '1.5px solid #2d6a9f', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 20 },
  error: { background: '#fff5f5', border: '1px solid #feb2b2', color: '#c53030', borderRadius: 8, padding: '12px 16px', marginTop: 16, fontSize: 14 }
};

export default function AdminEgresadosCrear() {
  const [escuelas, setEscuelas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  
  const [form, setForm] = useState({
    // Datos Personales
    tipo_doc: 'DNI',
    num_doc: '',
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    direccion: '',
    // Credenciales
    username: '',
    password: '',
    confirm_password: '',
    // Datos Académicos
    codigo_universitario: '',
    id_escuela: '',
    promocion: '',
    anio_ingreso: '',
    anio_egreso: '',
    sunedu_grado: 'Bachiller'
  });

  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/perfil/escuelas')
      .then(res => setEscuelas(res.data.data || []))
      .catch(e => setErr('Error al cargar las escuelas.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr('');
    
    // Validaciones de frontend
    if (form.password !== form.confirm_password) {
      setLoading(false);
      return setErr('Las contraseñas no coinciden.');
    }
    if (form.password.length < 6) {
      setLoading(false);
      return setErr('La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      const res = await adminService.crearEgresado(form);
      alert('Egresado y cuenta de usuario creados exitosamente.');
      navigate(`/perfil-egresado/${res.data.data.id_egresado}`);
    } catch (e) {
      setErr(e.response?.data?.message || 'Error al registrar egresado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.container}>
      <button style={s.btnOutline} onClick={() => navigate(-1)}>← Volver</button>
      
      <div style={s.header}>
        <h2 style={s.h2}>Registro Completo de Egresado</h2>
        <p style={{color:'#718096'}}>Crea una persona, su cuenta de usuario y su perfil de egresado en un solo paso.</p>
      </div>

      <div style={s.card}>
        <form onSubmit={handleSubmit}>
          
          <div style={{marginTop: 0}} className="section">
            <h3 style={s.sectionTitle}>1. Datos Personales</h3>
            <div style={s.row}>
              <div>
                <label style={s.label}>Tipo Doc *</label>
                <select style={s.select} name="tipo_doc" value={form.tipo_doc} onChange={handleChange}>
                  <option value="DNI">DNI</option>
                  <option value="CARNET_EXT">Carnet Ext.</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Nº Documento *</label>
                <input style={s.input} name="num_doc" required value={form.num_doc} onChange={handleChange} />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Nombres *</label>
                <input style={s.input} name="nombres" required value={form.nombres} onChange={handleChange} />
              </div>
              <div>
                <label style={s.label}>Apellidos *</label>
                <input style={s.input} name="apellidos" required value={form.apellidos} onChange={handleChange} />
              </div>
            </div>
            <div style={s.row}>
              <div>
                <label style={s.label}>Email *</label>
                <input style={s.input} type="email" name="email" required value={form.email} onChange={handleChange} />
              </div>
              <div>
                <label style={s.label}>Teléfono</label>
                <input style={s.input} name="telefono" value={form.telefono} onChange={handleChange} />
              </div>
            </div>
            <label style={s.label}>Dirección</label>
            <input style={s.input} name="direccion" value={form.direccion} onChange={handleChange} />
          </div>

          <div className="section">
            <h3 style={s.sectionTitle}>2. Credenciales de Acceso</h3>
            <label style={s.label}>Nombre de Usuario *</label>
            <input style={s.input} name="username" required value={form.username} onChange={handleChange} placeholder="Ej: jper_ez" />
            <div style={s.row}>
              <div>
                <label style={s.label}>Contraseña *</label>
                <input style={s.input} type="password" name="password" required value={form.password} onChange={handleChange} minLength={6} />
              </div>
              <div>
                <label style={s.label}>Confirmar Contraseña *</label>
                <input style={s.input} type="password" name="confirm_password" required value={form.confirm_password} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="section">
            <h3 style={s.sectionTitle}>3. Datos Académicos</h3>
            <label style={s.label}>Código Universitario *</label>
            <input style={s.input} name="codigo_universitario" required value={form.codigo_universitario} onChange={handleChange} />
            
            <label style={s.label}>Escuela Profesional *</label>
            <select style={s.select} name="id_escuela" required value={form.id_escuela} onChange={handleChange}>
              <option value="">-- Seleccionar Escuela --</option>
              {escuelas.map(esc => (
                <option key={esc.id_escuela} value={esc.id_escuela}>{esc.facultad} - {esc.nombre}</option>
              ))}
            </select>

            <div style={s.row}>
              <div>
                <label style={s.label}>Año Ingreso</label>
                <input style={s.input} type="number" name="anio_ingreso" value={form.anio_ingreso} onChange={handleChange} />
              </div>
              <div>
                <label style={s.label}>Año Egreso</label>
                <input style={s.input} type="number" name="anio_egreso" value={form.anio_egreso} onChange={handleChange} />
              </div>
            </div>

            <div style={s.row}>
              <div>
                <label style={s.label}>Grado Académico</label>
                <input style={s.input} name="sunedu_grado" value={form.sunedu_grado} onChange={handleChange} />
              </div>
              <div>
                <label style={s.label}>Promoción</label>
                <input style={s.input} name="promocion" value={form.promocion} onChange={handleChange} placeholder="Ej: 2018-II" />
              </div>
            </div>
          </div>

          {err && <div style={s.error}>⚠️ {err}</div>}

          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Creando registro completo...' : 'REGISTRAR EGRESADO Y CREAR CUENTA'}
          </button>
        </form>
      </div>
    </div>
  );
}
