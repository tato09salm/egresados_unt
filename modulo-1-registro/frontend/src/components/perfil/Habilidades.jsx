import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const s = {
  container: { marginTop: 0 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  h3: { fontSize: 18, fontWeight: 700, color: '#1a365d', margin: 0 },
  list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 },
  tag: { 
    display: 'flex', 
    flexDirection: 'column',
    gap: 4, 
    padding: '12px', 
    borderRadius: 12, 
    fontSize: 13, 
    fontWeight: 600, 
    background: '#fff', 
    color: '#1a365d', 
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  name: { color: '#2d3748', fontSize: 14 },
  remove: { 
    position: 'absolute',
    top: 8,
    right: 8,
    cursor: 'pointer', 
    fontSize: 16, 
    color: '#e53e3e',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: '#fff5f5',
    border: 'none',
    transition: 'all 0.2s'
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
    maxWidth: 400,
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  formTitle: { fontSize: 18, fontWeight: 700, color: '#1a365d', marginBottom: 20 },
  label: { display: 'block', fontSize: 12, fontWeight: 700, color: '#718096', marginBottom: 6, textTransform: 'uppercase' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', marginBottom: 16 },
  btn: { padding: '10px 20px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnCancel: { padding: '10px 20px', background: 'transparent', color: '#718096', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8 },
  btnAdd: { padding: '6px 12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  toast: {
    position: 'fixed', bottom: 24, right: 24, background: '#1a365d', color: '#fff', padding: '12px 24px', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 2000, animation: 'fadeInUp 0.3s ease'
  },
  badge: (nivel) => ({ 
    padding: '2px 8px', 
    borderRadius: 6, 
    fontSize: 10, 
    fontWeight: 800, 
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    width: 'fit-content',
    background: nivel === 'basico' ? '#fef3c7' : nivel === 'intermedio' ? '#dcfce7' : nivel === 'avanzado' ? '#dbeafe' : '#f3e8ff',
    color: nivel === 'basico' ? '#92400e' : nivel === 'intermedio' ? '#166534' : nivel === 'avanzado' ? '#1e40af' : '#6b21a8'
  })
};

export default function Habilidades({ id_egresado, currentHabs, onUpdate }) {
  const [allHabs, setAllHabs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newHab, setNewHab] = useState({ id_habilidad: '', nivel: 'intermedio' });
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/api/perfil/habilidades')
      .then(r => setAllHabs(r.data.data || []))
      .catch(console.error);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newHab.id_habilidad) return alert('Por favor seleccione una habilidad');
    try {
      await api.post(`/api/perfil/${id_egresado}/habilidades`, newHab);
      setNewHab({ id_habilidad: '', nivel: 'intermedio' });
      setShowModal(false);
      showToast('Habilidad agregada correctamente');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al agregar habilidad: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemove = async (id_hab, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar la habilidad "${nombre}"?`)) return;
    try {
      await api.delete(`/api/perfil/${id_egresado}/habilidades/${id_hab}`);
      showToast('Habilidad eliminada');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error al eliminar habilidad');
    }
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
        <h3 style={s.h3}>Habilidades</h3>
        <button style={s.btnAdd} onClick={() => setShowModal(true)}>+ Agregar</button>
      </div>
      
      <div style={s.list}>
        {currentHabs.map(h => (
          <div key={h.id_habilidad} style={s.tag}>
            <span style={s.name}>{h.nombre}</span>
            <span style={s.badge(h.nivel)}>{h.nivel}</span>
            <button style={s.remove} onClick={() => handleRemove(h.id_habilidad, h.nombre)} title="Eliminar">×</button>
          </div>
        ))}
        {currentHabs.length === 0 && <p style={{color:'#718096', fontSize:13, gridColumn: '1/-1', textAlign: 'center', padding: '20px'}}>Aún no has agregado habilidades.</p>}
      </div>

      {toast && <div style={s.toast}>✅ {toast}</div>}

      {showModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h4 style={s.formTitle}>Agregar Habilidad</h4>
            <form onSubmit={handleAdd}>
              <label style={s.label}>Habilidad</label>
              <select 
                style={s.select} 
                value={newHab.id_habilidad} 
                onChange={e => setNewHab({...newHab, id_habilidad: e.target.value})}
                required
              >
                <option value="">-- Seleccionar --</option>
                {allHabs
                  .filter(ah => !currentHabs.some(ch => ch.id_habilidad === ah.id_habilidad))
                  .map(ah => (
                    <option key={ah.id_habilidad} value={ah.id_habilidad}>{ah.categoria.toUpperCase()} - {ah.nombre}</option>
                  ))
                }
              </select>

              <label style={s.label}>Nivel de Dominio</label>
              <select 
                style={s.select} 
                value={newHab.nivel} 
                onChange={e => setNewHab({...newHab, nivel: e.target.value})}
              >
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="experto">Experto</option>
              </select>

              <button style={s.btn} type="submit">Guardar Habilidad</button>
              <button style={s.btnCancel} type="button" onClick={() => setShowModal(false)}>Cancelar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
