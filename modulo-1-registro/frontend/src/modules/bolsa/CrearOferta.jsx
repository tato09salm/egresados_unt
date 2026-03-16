import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  nav: { background:'#1a365d', color:'#fff', padding:'14px 32px', display:'flex', gap:16, alignItems:'center' },
  back: { background:'rgba(255,255,255,.15)', border:'none', color:'#fff', padding:'6px 14px', borderRadius:6, cursor:'pointer', fontSize:13 },
  body: { maxWidth:700, margin:'0 auto', padding:'28px 16px' },
  card: { background:'#fff', borderRadius:12, padding:28, boxShadow:'0 2px 8px rgba(0,0,0,.06)' },
  label: { display:'block', fontSize:12, fontWeight:600, color:'#4a5568', marginTop:16, marginBottom:5 },
  input: { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none' },
  select: { width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', background:'#fff' },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  btn: { padding:'12px 28px', background:'#276749', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer', marginTop:24 },
  err: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px', marginTop:12, fontSize:13 },
};

export default function CrearOferta() {
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const isAdmin = user?.rol === 'admin';
  const [form, setForm] = useState({ titulo:'', descripcion:'', requisitos:'', beneficios:'', salario_min:'', salario_max:'', modalidad:'presencial', tipo_contrato:'indefinido', vacantes:1 });
  const [habilidades, setHabilidades] = useState([]);
  const [selected, setSelected] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [idEmpresa, setIdEmpresa] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  useEffect(() => {
    api.get('/api/ofertas/habilidades')
      .then((r) => setHabilidades(r.data.data || []))
      .catch(() => {});

    if (isAdmin) {
      api.get('/api/empresas')
        .then((r) => {
          const list = r.data.data || [];
          setEmpresas(list);
          if (list[0]) setIdEmpresa(list[0].id_empresa);
        })
        .catch(() => {});
    }
  }, []);

  const toggleHabilidad = (id) => {
    setSelected((prev) => {
      if (prev[id]) {
        const clone = { ...prev };
        delete clone[id];
        return clone;
      }
      return { ...prev, [id]: true };
    });
  };

  const setRequired = (id, required) => {
    setSelected((prev) => ({ ...prev, [id]: required }));
  };

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isAdmin && !idEmpresa) {
        setError('Selecciona una empresa para publicar la oferta');
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        habilidades: Object.entries(selected).map(([id_habilidad, requerida]) => ({ id_habilidad, requerida })),
        ...(isAdmin ? { id_empresa: idEmpresa } : {}),
      };
      await api.post('/api/ofertas', payload);
      navigate('/bolsa/empresa');
    } catch(e) { setError(e.response?.data?.message || 'Error al crear oferta'); }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      <nav style={s.nav}>
        <button style={s.back} onClick={() => navigate('/bolsa/empresa')}>← Volver</button>
        <span style={{ fontWeight:700, fontSize:16 }}>📝 Nueva Oferta Laboral</span>
      </nav>
      <div style={s.body}>
        <div style={s.card}>
          <form onSubmit={handleSubmit}>
            {isAdmin && (
              <>
                <label style={s.label}>Empresa propietaria *</label>
                <select style={s.select} value={idEmpresa} onChange={e=>setIdEmpresa(e.target.value)} required>
                  {!empresas.length && <option value="">Sin empresas disponibles</option>}
                  {empresas.map((emp) => (
                    <option key={emp.id_empresa} value={emp.id_empresa}>{emp.nombre_comercial || emp.razon_social}</option>
                  ))}
                </select>
              </>
            )}

            <label style={s.label}>Título del puesto *</label>
            <input style={s.input} value={form.titulo} onChange={e=>set('titulo',e.target.value)} required placeholder="Ej: Desarrollador Full Stack Senior" />

            <label style={s.label}>Descripción *</label>
            <textarea style={{...s.input, resize:'vertical', minHeight:100}} value={form.descripcion} onChange={e=>set('descripcion',e.target.value)} required />

            <label style={s.label}>Requisitos</label>
            <textarea style={{...s.input, resize:'vertical', minHeight:80}} value={form.requisitos} onChange={e=>set('requisitos',e.target.value)} />

            <label style={s.label}>Beneficios</label>
            <textarea style={{...s.input, resize:'vertical', minHeight:60}} value={form.beneficios} onChange={e=>set('beneficios',e.target.value)} />

            <div style={s.row}>
              <div><label style={s.label}>Salario Mínimo (S/.)</label><input style={s.input} type="number" value={form.salario_min} onChange={e=>set('salario_min',e.target.value)} /></div>
              <div><label style={s.label}>Salario Máximo (S/.)</label><input style={s.input} type="number" value={form.salario_max} onChange={e=>set('salario_max',e.target.value)} /></div>
              <div><label style={s.label}>Modalidad</label>
                <select style={s.select} value={form.modalidad} onChange={e=>set('modalidad',e.target.value)}>
                  {['presencial','remoto','hibrido'].map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Tipo de Contrato</label>
                <select style={s.select} value={form.tipo_contrato} onChange={e=>set('tipo_contrato',e.target.value)}>
                  {['indefinido','plazo_fijo','practicas','services'].map(t=><option key={t} value={t}>{t.replace('_',' ')}</option>)}
                </select>
              </div>
              <div><label style={s.label}>Vacantes</label><input style={s.input} type="number" min={1} value={form.vacantes} onChange={e=>set('vacantes',e.target.value)} /></div>
              <div><label style={s.label}>Fecha de Cierre</label><input style={s.input} type="date" value={form.fecha_cierre||''} onChange={e=>set('fecha_cierre',e.target.value)} /></div>
            </div>

            <label style={s.label}>Habilidades Requeridas / Opcionales</label>
            <div style={{ border:'1.5px solid #e2e8f0', borderRadius:8, padding:12, maxHeight:180, overflowY:'auto' }}>
              {!habilidades.length && <div style={{ color:'#a0aec0', fontSize:12 }}>Sin habilidades disponibles</div>}
              {habilidades.map((h) => {
                const active = Object.prototype.hasOwnProperty.call(selected, h.id_habilidad);
                return (
                  <div key={h.id_habilidad} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'6px 0' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#2d3748' }}>
                      <input type="checkbox" checked={active} onChange={() => toggleHabilidad(h.id_habilidad)} />
                      <span>{h.nombre}</span>
                    </label>
                    {active && (
                      <select style={{ ...s.select, width:130, padding:'6px 8px' }} value={selected[h.id_habilidad] ? 'true' : 'false'} onChange={(e) => setRequired(h.id_habilidad, e.target.value === 'true')}>
                        <option value="true">Requerida</option>
                        <option value="false">Opcional</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <div style={s.err}>⚠️ {error}</div>}
            <button style={s.btn} disabled={loading}>{loading ? 'Publicando...' : '✓ Publicar Oferta'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
