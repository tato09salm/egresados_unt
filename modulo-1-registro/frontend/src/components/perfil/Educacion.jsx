import React, { useState } from 'react';
import api from '../../services/api';

const s = {
  container: { marginTop: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  h3: { fontSize: 18, fontWeight: 700, color: '#1a365d', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 },
  card: { 
    background: '#fff', 
    padding: '20px', 
    borderRadius: 16, 
    border: '1px solid #e2e8f0', 
    position: 'relative',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease'
  },
  actions: { position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 },
  actionBtn: { 
    cursor: 'pointer', 
    width: 32, 
    height: 32, 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    border: 'none',
    transition: 'all 0.2s'
  },
  btnEdit: { background: '#ebf8ff', color: '#2b6cb0' },
  btnDelete: { background: '#fff5f5', color: '#c53030' },
  nombre: { fontSize: 16, fontWeight: 700, color: '#1a365d' },
  institucion: { fontSize: 14, color: '#2d3748', fontWeight: 600, marginTop: 4 },
  fecha: { fontSize: 12, color: '#718096', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 },
  badge: (tipo) => ({ 
    display: 'inline-block', 
    padding: '2px 10px', 
    borderRadius: 6, 
    fontSize: 10, 
    fontWeight: 800, 
    textTransform: 'uppercase', 
    background: tipo === 'maestria' || tipo === 'doctorado' ? '#e0e7ff' : '#f3f4f6', 
    color: tipo === 'maestria' || tipo === 'doctorado' ? '#4338ca' : '#4a5568', 
    marginBottom: 8,
    letterSpacing: '0.5px'
  }),
  certLink: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 12, 
    padding: '6px 12px', 
    background: '#f0f9ff', 
    color: '#0369a1', 
    borderRadius: 8, 
    fontSize: 12, 
    fontWeight: 700, 
    textDecoration: 'none',
    border: '1px solid #bae6fd'
  },

  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    background: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  formTitle: { fontSize: 18, fontWeight: 700, color: '#1a365d', marginBottom: 20 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 6, textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', marginBottom: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btn: { padding: '12px 20px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnCancel: { padding: '12px 20px', background: 'transparent', color: '#718096', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8 },
  btnAdd: { padding: '6px 12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  toast: {
    position: 'fixed', bottom: 24, right: 24, background: '#1a365d', color: '#fff', padding: '12px 24px', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, animation: 'fadeInUp 0.3s ease'
  }
};

export default function Educacion({ id_egresado, educacion, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ tipo: 'curso', nombre: '', institucion: '', fecha_inicio: '', fecha_fin: '', url_certificado: '' });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setForm({ tipo: 'curso', nombre: '', institucion: '', fecha_inicio: '', fecha_fin: '', url_certificado: '' });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (edu) => {
    setForm({
      tipo: edu.tipo,
      nombre: edu.nombre,
      institucion: edu.institucion,
      fecha_inicio: edu.fecha_inicio ? edu.fecha_inicio.split('T')[0] : '',
      fecha_fin: edu.fecha_fin ? edu.fecha_fin.split('T')[0] : '',
      url_certificado: edu.url_certificado || ''
    });
    setEditingId(edu.id_edu);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.institucion) return alert('Nombre e institución son obligatorios');
    
    try {
      if (editingId) {
        await api.put(`/api/perfil/${id_egresado}/educacion/${editingId}`, form);
        showToast('Educación actualizada');
      } else {
        await api.post(`/api/perfil/${id_egresado}/educacion`, form);
        showToast('Educación agregada');
      }
      setShowModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al guardar educación: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemove = async (id_edu, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return;
    try {
      await api.delete(`/api/perfil/${id_egresado}/educacion/${id_edu}`);
      showToast('Educación eliminada');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al eliminar educación');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={s.container}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={s.header}>
        <h3 style={s.h3}>Educación Continua</h3>
        <button style={s.btnAdd} onClick={handleOpenAdd}>+ Agregar</button>
      </div>
      
      <div style={s.list}>
        {educacion.map(edu => (
          <div key={edu.id_edu} style={s.card}>
            <div style={s.actions}>
              <button style={{...s.actionBtn, ...s.btnEdit}} onClick={() => handleOpenEdit(edu)} title="Editar">✏️</button>
              <button style={{...s.actionBtn, ...s.btnDelete}} onClick={() => handleRemove(edu.id_edu, edu.nombre)} title="Eliminar">🗑️</button>
            </div>
            <div style={s.badge(edu.tipo)}>{edu.tipo}</div>
            <div style={s.nombre}>{edu.nombre}</div>
            <div style={s.institucion}>{edu.institucion}</div>
            <div style={s.fecha}>
              <span>📅 {edu.fecha_inicio ? formatDate(edu.fecha_inicio) : 'N/A'}</span>
              <span>—</span>
              <span>{edu.fecha_fin ? formatDate(edu.fecha_fin) : 'En curso'}</span>
            </div>
            {edu.url_certificado && (
              <a href={edu.url_certificado} target="_blank" rel="noreferrer" style={s.certLink}>
                📜 Ver Certificado
              </a>
            )}
          </div>
        ))}
        {educacion.length === 0 && <p style={{color:'#718096', fontSize:13, textAlign: 'center', padding: '20px'}}>No has registrado cursos o certificaciones.</p>}
      </div>

      {toast && <div style={s.toast}>✅ {toast}</div>}

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h4 style={s.formTitle}>{editingId ? 'Editar Educación' : 'Agregar Educación'}</h4>
            <form onSubmit={handleSave}>
              <div style={s.row}>
                <div>
                  <label style={s.label}>Tipo de Estudio</label>
                  <select 
                    style={s.input} 
                    value={form.tipo} 
                    onChange={e => setForm({...form, tipo: e.target.value})}
                  >
                    <option value="curso">Curso</option>
                    <option value="certificacion">Certificación</option>
                    <option value="diplomado">Diplomado</option>
                    <option value="maestria">Maestría</option>
                    <option value="doctorado">Doctorado</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label style={s.label}>Nombre del Programa *</label>
                  <input 
                    style={s.input} 
                    placeholder="Ej: Especialista en Cloud Computing" 
                    value={form.nombre} 
                    onChange={e => setForm({...form, nombre: e.target.value})} 
                    required
                  />
                </div>
              </div>

              <label style={s.label}>Institución *</label>
              <input 
                style={s.input} 
                placeholder="Ej: Coursera, Universidad de Lima, etc." 
                value={form.institucion} 
                onChange={e => setForm({...form, institucion: e.target.value})} 
                required
              />

              <div style={s.row}>
                <div>
                  <label style={s.label}>Fecha Inicio</label>
                  <input 
                    style={s.input} 
                    type="date" 
                    value={form.fecha_inicio} 
                    onChange={e => setForm({...form, fecha_inicio: e.target.value})} 
                  />
                </div>
                <div>
                  <label style={s.label}>Fecha Fin</label>
                  <input 
                    style={s.input} 
                    type="date" 
                    value={form.fecha_fin} 
                    onChange={e => setForm({...form, fecha_fin: e.target.value})} 
                  />
                </div>
              </div>

              <label style={s.label}>URL del Certificado (opcional)</label>
              <input 
                style={s.input} 
                placeholder="https://..." 
                value={form.url_certificado} 
                onChange={e => setForm({...form, url_certificado: e.target.value})} 
              />

              <button style={s.btn} type="submit">{editingId ? 'Guardar Cambios' : 'Agregar Educación'}</button>
              <button style={s.btnCancel} type="button" onClick={() => setShowModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
