import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin';

const s = {
  container: { padding: '40px 20px', maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, gap: 12, flexWrap: 'wrap' },
  h2: { margin: 0, color: '#1a365d' },
  subtitle: { margin: '6px 0 0', color: '#64748b', fontSize: 13, fontWeight: 700 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#64748b', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
  badge: (color) => ({ display: 'inline-block', padding: '4px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: color.bg, color: color.fg, border: `1px solid ${color.bd}` }),
  btn: { padding: '10px 14px', background: '#2d6a9f', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 800 },
  btnGhost: { padding: '10px 14px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontWeight: 800 },
  rowActions: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  info: { background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 700 },
  error: { background: '#fff5f5', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 800 },
};

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

function moduloLabel(mod) {
  switch ((mod || '').toLowerCase()) {
    case 'registro': return 'Módulo 1 (Registro y Perfil)';
    case 'bolsa': return 'Módulo 2 (Bolsa Laboral)';
    case 'seguimiento': return 'Módulo 3 (Seguimiento)';
    case 'mentores': return 'Módulo 4 (Mentores)';
    case 'inicio': return 'Inicio';
    default: return mod || '—';
  }
}

export default function BitacoraAuditoria() {
  const navigate = useNavigate();
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('sge_user') || '{}'); } catch { return {}; }
  }, []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await adminService.getBitacora({ limit: 200, offset: 0 });
      setRows(res.data.data || []);
    } catch (e) {
      setErr(e.response?.data?.message || 'No se pudo cargar la bitácora.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.rol !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleColors = (rol) => {
    const r = (rol || '').toLowerCase();
    if (r === 'admin') return { bg: '#dcfce7', fg: '#166534', bd: '#86efac' };
    if (r === 'empresa') return { bg: '#fff7ed', fg: '#9a3412', bd: '#fed7aa' };
    return { bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' };
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div>
          <h2 style={s.h2}>Bitácora de auditoría</h2>
        </div>
        <div style={s.rowActions}>
          <button style={s.btn} onClick={load}>Actualizar</button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={s.info}>
          Nota: “Módulo” muestra el último módulo detectado durante la sesión (según navegación). Si un usuario cierra el navegador sin cerrar sesión, la “hora de salida” puede quedar en blanco.
        </div>
      </div>

      {err && <div style={{ ...s.error, marginBottom: 14 }}>{err}</div>}
      {loading && <div style={{ color: '#64748b', fontWeight: 800 }}>Cargando bitácora...</div>}

      {!loading && (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>¿Quién ingresó?</th>
                <th style={s.th}>Rol</th>
                <th style={s.th}>Fecha y hora de ingreso</th>
                <th style={s.th}>Fecha y hora de salida</th>
                <th style={s.th}>Último módulo detectado</th>
                <th style={s.th}>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id_acceso}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 900, color: '#0f172a' }}>{r.nombres || '—'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800 }}>{r.username}</div>
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(roleColors(r.rol))}>{(r.rol || '—').toUpperCase()}</span>
                  </td>
                  <td style={s.td}>{formatDateTime(r.ingreso_at)}</td>
                  <td style={s.td}>{formatDateTime(r.salida_at)}</td>
                  <td style={s.td}>{moduloLabel(r.modulo_actual)}</td>
                  <td style={s.td}>{r.ip_origen || '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td style={s.td} colSpan={6}>No hay registros para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

