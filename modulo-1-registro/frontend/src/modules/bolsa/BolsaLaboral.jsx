import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight:'100vh', background:'#f0f4f8' },
  body: { maxWidth:1100, margin:'0 auto', padding:'28px 16px' },
  filters: { background:'#fff', borderRadius:10, padding:20, marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'flex-end', boxShadow:'0 1px 4px rgba(0,0,0,.06)' },
  input: { padding:'8px 12px', border:'1.5px solid #e2e8f0', borderRadius:7, fontSize:13, outline:'none', minWidth:140 },
  btn: { padding:'8px 18px', background:'#276749', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 },
  btnOutline: { padding:'8px 18px', background:'#f8fafc', border:'1.5px solid #0f766e', color:'#0f766e', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 },
  btnSecondary: { padding:'8px 18px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 },
  btnPdf: { padding:'8px 18px', background:'#ef4444', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:800 },
  btnAddSkill: { padding:'8px 18px', background:'#0891b2', color:'#fff', border:'none', borderRadius:7, cursor:'pointer', fontSize:13, fontWeight:700 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:20 },
  card: { background:'#fff', borderRadius:12, padding:22, boxShadow:'0 2px 8px rgba(0,0,0,.06)', cursor:'pointer', transition:'transform .15s, box-shadow .15s', display:'flex', flexDirection:'column', gap:10 },
  badge: (c) => ({ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:c+'22', color:c }),
  chip: { display:'inline-flex', alignItems:'center', gap:8, padding:'4px 10px', borderRadius:16, background:'#ebf8ff', color:'#2b6cb0', fontSize:12, fontWeight:600, border:'1px solid #bee3f8' },
  chipClose: { border:'none', background:'transparent', color:'#2b6cb0', cursor:'pointer', fontSize:14, lineHeight:1 },
  helperError: { width:'100%', fontSize:12, color:'#c53030', marginTop:2 },
  matchesBox: { width:'100%', padding:'10px 12px', border:'1px dashed #cbd5e1', borderRadius:8, background:'#f8fafc', fontSize:12, color:'#334155' },
};

const modalidadColor = { presencial:'#276749', remoto:'#2d6a9f', hibrido:'#744210' };
const contratoOpts = ['indefinido', 'plazo_fijo', 'practicas', 'services'];

export default function BolsaLaboral() {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ modalidad:'', sector:'', salario_min:'', salario_max:'', tipo_contrato:'' });
  const [sectores, setSectores] = useState([]);
  const [habilidadesCatalogo, setHabilidadesCatalogo] = useState([]);
  const [habilidadesSeleccionadas, setHabilidadesSeleccionadas] = useState([]);
  const [habilidadInput, setHabilidadInput] = useState('');
  const [skillMatches, setSkillMatches] = useState({});
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [recomendadas, setRecomendadas] = useState([]);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  const salarioMinNum = filtros.salario_min !== '' ? Number(filtros.salario_min) : null;
  const salarioMaxNum = filtros.salario_max !== '' ? Number(filtros.salario_max) : null;
  const salarioInvalido = useMemo(() => (
    salarioMinNum !== null && salarioMaxNum !== null && salarioMinNum > salarioMaxNum
  ), [salarioMinNum, salarioMaxNum]);

  const filtrosNormalizados = useMemo(() => {
    let min = filtros.salario_min;
    let max = filtros.salario_max;
    if (salarioInvalido) {
      min = String(salarioMaxNum);
      max = String(salarioMinNum);
    }
    return {
      ...filtros,
      salario_min: min,
      salario_max: max,
    };
  }, [filtros, salarioInvalido, salarioMinNum, salarioMaxNum]);

  const buildParams = (nextPage = page, nextLimit = 9, opts = {}) => {
    const { includeSelectedSkills = true, singleSkill = '' } = opts;
    const paramsObj = {
      page: nextPage,
      limit: nextLimit,
      ...Object.fromEntries(Object.entries(filtrosNormalizados).filter(([, v]) => v !== '')),
    };
    if (singleSkill) {
      paramsObj.habilidad = singleSkill;
    } else if (includeSelectedSkills && habilidadesSeleccionadas.length > 0) {
      paramsObj.habilidades = habilidadesSeleccionadas.join(',');
    }
    return new URLSearchParams(paramsObj);
  };

  useEffect(() => { cargarOfertas(); }, [page, filtrosNormalizados, habilidadesSeleccionadas]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resSectores, resHabilidades] = await Promise.all([
          api.get('/api/ofertas/sectores'),
          api.get('/api/ofertas/habilidades'),
        ]);
        setSectores(resSectores.data.data || []);
        setHabilidadesCatalogo((resHabilidades.data.data || []).map((h) => h.nombre));
      } catch (_) {
        setSectores([]);
        setHabilidadesCatalogo([]);
      }
    };
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (user.rol === 'egresado') {
      api.get('/api/match/recomendaciones').then(r => setRecomendadas(r.data.data || [])).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const calcularCoincidencias = async () => {
      if (!habilidadesSeleccionadas.length) {
        setSkillMatches({});
        return;
      }
      try {
        const resultados = await Promise.all(
          habilidadesSeleccionadas.map(async (skill) => {
            const params = buildParams(1, 1, { includeSelectedSkills: false, singleSkill: skill });
            const r = await api.get(`/api/ofertas?${params}`);
            return [skill, r.data?.pagination?.total || 0];
          })
        );
        setSkillMatches(Object.fromEntries(resultados));
      } catch (_) {
        setSkillMatches({});
      }
    };
    calcularCoincidencias();
  }, [habilidadesSeleccionadas, filtrosNormalizados]);

  const cargarOfertas = async () => {
    setLoading(true);
    try {
      const params = buildParams(page, 9);
      const r = await api.get(`/api/ofertas?${params}`);
      setOfertas(r.data.data || []);
      setPagination(r.data.pagination);
    } catch(e) { if(e.response?.status===401) navigate('/login'); }
    setLoading(false);
  };

  const agregarHabilidad = (habilidad) => {
    const normalized = (habilidad || '').trim();
    if (!normalized) return;
    const exists = habilidadesSeleccionadas.some((h) => h.toLowerCase() === normalized.toLowerCase());
    if (exists) return;
    setHabilidadesSeleccionadas((prev) => [...prev, normalized]);
    setHabilidadInput('');
    setPage(1);
  };

  const quitarHabilidad = (habilidad) => {
    setHabilidadesSeleccionadas((prev) => prev.filter((h) => h !== habilidad));
    setPage(1);
  };

  const exportarOfertasPdf = async () => {
    setExportingPdf(true);
    try {
      const params = buildParams(1, 500);
      const r = await api.get(`/api/ofertas?${params}`);
      const data = r.data.data || [];

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('SGE-UNT | Bolsa Laboral', 14, 16);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 14, 22);
      doc.text(`Ofertas incluidas: ${data.length}`, 14, 27);

      autoTable(doc, {
        startY: 32,
        head: [['Titulo', 'Empresa', 'Sector', 'Modalidad', 'Contrato', 'Salario', 'Vacantes']],
        body: data.map((o) => {
          const salario = o.salario_min && o.salario_max
            ? `S/. ${Number(o.salario_min).toFixed(0)} - ${Number(o.salario_max).toFixed(0)}`
            : o.salario_min
              ? `S/. ${Number(o.salario_min).toFixed(0)}+`
              : 'A negociar';
          return [
            o.titulo,
            o.empresa || '-',
            o.sector || '-',
            o.modalidad || '-',
            (o.tipo_contrato || '-').replace('_', ' '),
            salario,
            String(o.vacantes || 0),
          ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 54, 93] },
        alternateRowStyles: { fillColor: [245, 248, 252] },
      });

      doc.save('ofertas_sge_unt.pdf');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.body}>
        {/* Panel de Navegación de Bolsa */}
        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          {user.rol === 'egresado' && <button style={{...s.btn, background:'#1a365d'}} onClick={() => navigate('/bolsa/postulaciones')}>📁 Mis Postulaciones</button>}
          {user.rol === 'empresa' && <button style={{...s.btn, background:'#1a365d'}} onClick={() => navigate('/bolsa/empresa')}>🏢 Panel Empresa</button>}
        </div>

        {/* Recomendadas para egresados */}
        {recomendadas.length > 0 && (
          <div style={{ marginBottom:28 }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:'#1a365d', marginBottom:14 }}>⭐ Recomendadas para ti</h3>
            <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8 }}>
              {recomendadas.map(o => (
                <div key={o.id_oferta} onClick={() => navigate(`/bolsa/ofertas/${o.id_oferta}`)}
                  style={{ ...s.card, minWidth:260, flexShrink:0, borderTop:'3px solid #f6ad55' }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1a365d' }}>{o.titulo}</div>
                  <div style={{ fontSize:12, color:'#718096' }}>{o.empresa}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:22, fontWeight:700, color:'#276749' }}>{o.puntaje_match}%</span>
                    <span style={{ fontSize:11, color:'#718096' }}>compatibilidad</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        <div style={s.filters}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>MODALIDAD</div>
            <select style={s.input} value={filtros.modalidad} onChange={e=>{ setFiltros({...filtros,modalidad:e.target.value}); setPage(1); }}>
              <option value="">Todas</option>
              {['presencial','remoto','hibrido'].map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SECTOR</div>
            <select style={s.input} value={filtros.sector} onChange={e=>{ setFiltros({...filtros,sector:e.target.value}); setPage(1); }}>
              <option value="">Todos</option>
              {sectores.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>CONTRATO</div>
            <select style={s.input} value={filtros.tipo_contrato} onChange={e=>{ setFiltros({...filtros,tipo_contrato:e.target.value}); setPage(1); }}>
              <option value="">Todos</option>
              {contratoOpts.map((tipo) => <option key={tipo} value={tipo}>{tipo.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SALARIO MINIMO</div>
            <input style={s.input} type="number" min="0" placeholder="Desde" value={filtros.salario_min} onChange={e=>{ setFiltros({...filtros,salario_min:e.target.value}); setPage(1); }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>SALARIO MAXIMO</div>
            <input style={s.input} type="number" min="0" placeholder="Hasta" value={filtros.salario_max} onChange={e=>{ setFiltros({...filtros,salario_max:e.target.value}); setPage(1); }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:'#718096', marginBottom:4 }}>HABILIDADES</div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                style={s.input}
                list="skills-list"
                placeholder="Ej: React"
                value={habilidadInput}
                onChange={(e)=>setHabilidadInput(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === 'Enter') { e.preventDefault(); agregarHabilidad(habilidadInput); } }}
              />
              <datalist id="skills-list">
                {habilidadesCatalogo
                  .filter((h) => !habilidadesSeleccionadas.some((x) => x.toLowerCase() === h.toLowerCase()))
                  .map((h) => <option key={h} value={h} />)}
              </datalist>
              <button style={s.btnAddSkill} onClick={() => agregarHabilidad(habilidadInput)}>➕ Agregar</button>
            </div>
          </div>

          <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap' }}>
            <button style={s.btnOutline} onClick={() => { setFiltros({ modalidad:'', sector:'', salario_min:'', salario_max:'', tipo_contrato:'' }); setHabilidadesSeleccionadas([]); setHabilidadInput(''); setPage(1); }}>🧹 Limpiar</button>
            <button style={s.btnPdf} onClick={exportarOfertasPdf} disabled={exportingPdf}>{exportingPdf ? '⏳ Generando PDF...' : '📄 Descargar PDF'}</button>
            {user.rol === 'empresa' && (
              <button style={s.btn} onClick={() => navigate('/bolsa/empresa/oferta/nueva')}>🏢 + Nueva Oferta</button>
            )}
          </div>

          {salarioInvalido && <div style={s.helperError}>Se detecto un rango invertido. El sistema lo corrige automaticamente para filtrar.</div>}
          {habilidadesSeleccionadas.length > 0 && (
            <div style={{ width:'100%', display:'grid', gap:10, marginTop:4 }}>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {habilidadesSeleccionadas.map((h) => (
                  <span key={h} style={s.chip}>
                    {h}
                    <button style={s.chipClose} onClick={() => quitarHabilidad(h)} aria-label={`Quitar ${h}`}>x</button>
                  </span>
                ))}
              </div>
              <div style={s.matchesBox}>
                <div style={{ fontWeight:700, marginBottom:6 }}>Coincidencias:</div>
                {habilidadesSeleccionadas.map((h) => (
                  <div key={`match-${h}`} style={{ display:'flex', justifyContent:'space-between', maxWidth:260 }}>
                    <span>{h}</span>
                    <span style={{ fontWeight:700 }}>({skillMatches[h] ?? 0})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Listado */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#718096' }}>Cargando ofertas...</div>
        ) : (
          <>
            <div style={{ fontSize:13, color:'#718096', marginBottom:16 }}>
              {pagination ? `${pagination.total} ofertas encontradas` : ''}
            </div>
            <div style={s.grid}>
              {ofertas.map(o => (
                <div key={o.id_oferta} style={s.card}
                  onClick={() => navigate(`/bolsa/ofertas/${o.id_oferta}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,.06)'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'#1a365d', flex:1 }}>{o.titulo}</div>
                    <span style={s.badge(modalidadColor[o.modalidad] || '#718096')}>{o.modalidad}</span>
                  </div>
                  <div style={{ fontSize:13, color:'#718096' }}>🏢 {o.empresa}</div>
                  {user.rol === 'egresado' && Number.isFinite(Number(o.puntaje_match)) && (
                    <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontSize:22, fontWeight:700, color:'#276749' }}>{Math.round(Number(o.puntaje_match))}%</span>
                      <span style={{ fontSize:11, color:'#718096' }}>compatibilidad</span>
                    </div>
                  )}
                  {o.sector && <div style={{ fontSize:12, color:'#a0aec0' }}>📁 {o.sector}</div>}
                  <div style={{ fontSize:13, color:'#276749', fontWeight:600 }}>
                    {o.salario_min && o.salario_max ? `S/. ${o.salario_min.toLocaleString()} – ${o.salario_max.toLocaleString()}` : o.salario_min ? `S/. ${o.salario_min.toLocaleString()}+` : 'Salario a negociar'}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#a0aec0', marginTop:4 }}>
                    <span>📅 {new Date(o.fecha_publicacion).toLocaleDateString('es-PE')}</span>
                    <span>👥 {o.total_postulantes || 0} postulantes · {o.vacantes} vacante{o.vacantes>1?'s':''}</span>
                  </div>
                </div>
              ))}
            </div>
            {!ofertas.length && <div style={{ textAlign:'center', padding:60, color:'#a0aec0' }}>No se encontraron ofertas con los filtros aplicados</div>}
            {/* Paginación */}
            {pagination && pagination.totalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:32 }}>
                <button style={s.btnOutline} disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)}>← Anterior</button>
                <span style={{ padding:'8px 16px', fontSize:13, color:'#718096' }}>Página {pagination.page} de {pagination.totalPages}</span>
                <button style={s.btn} disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
