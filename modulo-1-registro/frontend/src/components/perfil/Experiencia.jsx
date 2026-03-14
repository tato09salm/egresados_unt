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
  empresa: { fontSize: 16, fontWeight: 700, color: '#1a365d' },
  cargo: { fontSize: 14, color: '#2d3748', fontWeight: 600, marginTop: 4 },
  fecha: { 
    fontSize: 12, 
    color: '#718096', 
    marginTop: 8, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6,
    fontWeight: 500
  },
  badgeActual: { 
    background: '#f0fdf4', 
    color: '#166534', 
    padding: '2px 8px', 
    borderRadius: 6, 
    fontSize: 10, 
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  desc: { fontSize: 13, color: '#4a5568', marginTop: 12, lineHeight: '1.6', background: '#f8fafc', padding: '12px', borderRadius: 8 },
  
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
  textarea: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', marginBottom: 16, minHeight: 100, resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btn: { padding: '12px 20px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnCancel: { padding: '12px 20px', background: 'transparent', color: '#718096', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8 },
  btnAdd: { padding: '6px 12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  toast: {
    position: 'fixed', bottom: 24, right: 24, background: '#1a365d', color: '#fff', padding: '12px 24px', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, animation: 'fadeInUp 0.3s ease'
  }
};

export default function Experiencia({ id_egresado, experiencias, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '', actual: false });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setForm({ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '', actual: false });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (exp) => {
    setForm({
      empresa: exp.empresa,
      cargo: exp.cargo,
      fecha_inicio: exp.fecha_inicio ? exp.fecha_inicio.split('T')[0] : '',
      fecha_fin: exp.fecha_fin ? exp.fecha_fin.split('T')[0] : '',
      descripcion: exp.descripcion || '',
      actual: exp.actual || false
    });
    setEditingId(exp.id_exp);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.empresa || !form.cargo || !form.fecha_inicio) return alert('Por favor complete los campos obligatorios');
    
    try {
      if (editingId) {
        await api.put(`/api/perfil/${id_egresado}/experiencia/${editingId}`, form);
        showToast('Experiencia actualizada');
      } else {
        await api.post(`/api/perfil/${id_egresado}/experiencia`, form);
        showToast('Experiencia agregada');
      }
      setShowModal(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al guardar experiencia: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemove = async (id_exp, empresa) => {
    if (!window.confirm(`¿Estás seguro de eliminar la experiencia en "${empresa}"?`)) return;
    try {
      await api.delete(`/api/perfil/${id_egresado}/experiencia/${id_exp}`);
      showToast('Experiencia eliminada');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al eliminar experiencia');
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
        <h3 style={s.h3}>Experiencia Laboral</h3>
        <button style={s.btnAdd} onClick={handleOpenAdd}>+ Agregar</button>
      </div>
      
      <div style={s.list}>
        {experiencias.map(exp => (
          <div key={exp.id_exp} style={s.card}>
            <div style={s.actions}>
              <button style={{...s.actionBtn, ...s.btnEdit}} onClick={() => handleOpenEdit(exp)} title="Editar">✏️</button>
              <button style={{...s.actionBtn, ...s.btnDelete}} onClick={() => handleRemove(exp.id_exp, exp.empresa)} title="Eliminar">🗑️</button>
            </div>
            <div style={s.empresa}>{exp.empresa}</div>
            <div style={s.cargo}>{exp.cargo}</div>
            <div style={s.fecha}>
              <span>📅 {formatDate(exp.fecha_inicio)}</span>
              <span>—</span>
              {exp.actual ? <span style={s.badgeActual}>Actual</span> : <span>{formatDate(exp.fecha_fin)}</span>}
            </div>
            {exp.descripcion && <div style={s.desc}>{exp.descripcion}</div>}
          </div>
        ))}
        {experiencias.length === 0 && <p style={{color:'#718096', fontSize:13, textAlign: 'center', padding: '20px'}}>No has registrado experiencias laborales.</p>}
      </div>

      {toast && <div style={s.toast}>✅ {toast}</div>}

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h4 style={s.formTitle}>{editingId ? 'Editar Experiencia' : 'Agregar Experiencia'}</h4>
            <form onSubmit={handleSave}>
              <label style={s.label}>Empresa *</label>
              <input 
                style={s.input} 
                placeholder="Ej: Google, Universidad Nacional de Trujillo" 
                value={form.empresa} 
                onChange={e => setForm({...form, empresa: e.target.value})} 
                required
              />

              <label style={s.label}>Cargo *</label>
              <input 
                style={s.input} 
                placeholder="Ej: Desarrollador Senior, Analista" 
                value={form.cargo} 
                onChange={e => setForm({...form, cargo: e.target.value})} 
                required
              />

              <div style={s.row}>
                <div>
                  <label style={s.label}>Fecha Inicio *</label>
                  <input 
                    style={s.input} 
                    type="date" 
                    value={form.fecha_inicio} 
                    onChange={e => setForm({...form, fecha_inicio: e.target.value})} 
                    required
                  />
                </div>
                <div>
                  <label style={s.label}>Fecha Fin</label>
                  <input 
                    style={s.input} 
                    type="date" 
                    disabled={form.actual}
                    value={form.fecha_fin} 
                    onChange={e => setForm({...form, fecha_fin: e.target.value})} 
                  />
                </div>
              </div>

              <label style={{fontSize:13, display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom: 20}}>
                <input 
                  type="checkbox" 
                  checked={form.actual} 
                  onChange={e => setForm({...form, actual: e.target.checked, fecha_fin: e.target.checked ? '' : form.fecha_fin})} 
                />
                <span style={{fontWeight: 600, color: '#4a5568'}}>Este es mi trabajo actual</span>
              </label>

              <label style={s.label}>Descripción de funciones</label>
              <textarea 
                style={s.textarea} 
                placeholder="Describe tus principales logros y responsabilidades..." 
                value={form.descripcion} 
                onChange={e => setForm({...form, descripcion: e.target.value})}
              />

              <button style={s.btn} type="submit">{editingId ? 'Guardar Cambios' : 'Agregar Experiencia'}</button>
              <button style={s.btnCancel} type="button" onClick={() => setShowModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
