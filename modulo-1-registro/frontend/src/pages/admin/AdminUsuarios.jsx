import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin';
import CrearEgresadoModal from '../../components/admin/CrearEgresadoModal';

const s = {
  container: { padding: '40px 20px', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  h2: { margin: 0, color: '#1a365d' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  th: { background: '#f8fafc', padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', fontSize: 14, borderBottom: '1px solid #f1f5f9' },
  badge: (has) => ({ padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: has ? '#dcfce7' : '#fef3c7', color: has ? '#166534' : '#92400e' }),
  btn: { padding: '6px 12px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 },
  btnView: { padding: '6px 12px', background: '#edf2f7', color: '#2d6a9f', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, marginRight: 8 }
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsuarios();
      setUsuarios(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  if (loading) return <div style={s.container}>Cargando usuarios...</div>;

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.h2}>Gestión de Usuarios</h2>
        <div style={{display:'flex', gap:12}}>
          <button style={{...s.btn, background:'#166534'}} onClick={() => navigate('/admin/egresados/crear')}>
            ➕ REGISTRAR EGRESADO
          </button>
          <button style={s.btn} onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>USUARIO</th>
            <th style={s.th}>EMAIL</th>
            <th style={s.th}>ROL</th>
            <th style={s.th}>ESTADO PERFIL</th>
            <th style={s.th}>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id_usuario}>
              <td style={s.td}>
                <b>{u.nombres} {u.apellidos}</b><br/>
                <span style={{fontSize:12, color:'#94a3b8'}}>@{u.username}</span>
              </td>
              <td style={s.td}>{u.email}</td>
              <td style={s.td}>{u.rol}</td>
              <td style={s.td}>
                <span style={s.badge(u.tiene_egresado)}>
                  {u.tiene_egresado ? 'CON PERFIL' : 'SIN PERFIL'}
                </span>
              </td>
              <td style={s.td}>
                {u.tiene_egresado ? (
                  <button 
                    style={s.btnView} 
                    onClick={() => navigate(`/perfil-egresado/${u.id_egresado}`)}
                  >
                    Ver Perfil
                  </button>
                ) : (
                  u.rol === 'egresado' && (
                    <button style={s.btn} onClick={() => handleCreateProfile(u)}>
                      Asociar Egresado
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <CrearEgresadoModal 
          usuario={selectedUser} 
          onClose={() => setShowModal(false)} 
          onSuccess={loadUsuarios} 
        />
      )}
    </div>
  );
}
