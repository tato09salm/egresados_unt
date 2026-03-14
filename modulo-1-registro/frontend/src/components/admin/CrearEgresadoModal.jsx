import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import adminService from '../../services/admin';

const s = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  h3: { margin: '0 0 20px 0', color: '#1a365d' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#4a5568', marginBottom: 4, marginTop: 12 },
  input: { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  select: { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  btn: { padding: '10px 20px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  btnCancel: { padding: '10px 20px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
};

export default function CrearEgresadoModal({ usuario, onClose, onSuccess }) {
  const [escuelas, setEscuelas] = useState([]);
  const [form, setForm] = useState({
    codigo_universitario: '',
    id_escuela: '',
    promocion: '',
    anio_ingreso: '',
    anio_egreso: '',
    sunedu_grado: 'Bachiller'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/api/perfil/escuelas').then(r => setEscuelas(r.data.data || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminService.crearEgresado({
        ...form,
        id_persona: usuario.id_persona
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear egresado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <h3 style={s.h3}>Asociar Perfil de Egresado</h3>
        <p style={{fontSize: 14, color: '#718096'}}>Usuario: <b>{usuario.nombres} {usuario.apellidos}</b></p>
        
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Código Universitario *</label>
          <input 
            style={s.input} 
            required 
            value={form.codigo_universitario} 
            onChange={e => setForm({...form, codigo_universitario: e.target.value})} 
          />

          <label style={s.label}>Escuela Profesional *</label>
          <select 
            style={s.select} 
            required 
            value={form.id_escuela} 
            onChange={e => setForm({...form, id_escuela: e.target.value})}
          >
            <option value="">-- Seleccionar --</option>
            {escuelas.map(esc => (
              <option key={esc.id_escuela} value={esc.id_escuela}>{esc.facultad} - {esc.nombre}</option>
            ))}
          </select>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div>
              <label style={s.label}>Año Ingreso</label>
              <input style={s.input} type="number" value={form.anio_ingreso} onChange={e => setForm({...form, anio_ingreso: e.target.value})} />
            </div>
            <div>
              <label style={s.label}>Año Egreso</label>
              <input style={s.input} type="number" value={form.anio_egreso} onChange={e => setForm({...form, anio_egreso: e.target.value})} />
            </div>
          </div>

          <label style={s.label}>Grado Académico</label>
          <input style={s.input} value={form.sunedu_grado} onChange={e => setForm({...form, sunedu_grado: e.target.value})} placeholder="Bachiller, Titulado..." />

          <div style={s.footer}>
            <button type="button" style={s.btnCancel} onClick={onClose}>Cancelar</button>
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
