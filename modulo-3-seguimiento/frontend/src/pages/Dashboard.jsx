import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, registerables } from 'chart.js';
import api from '../services/api';

Chart.register(...registerables);

const COLORS = {
  blue: '#1e3a5f', green: '#276749', amber: '#744210', purple: '#553c9a', teal: '#2d6a9f',
};

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadTextFile(filename, text, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadFromApi(apiClient, url, filename) {
  const res = await apiClient.get(url, { responseType: 'blob' });
  const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function openPrintHtml({ title, subtitle, bodyHtml }) {
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) return;
  const now = new Date().toLocaleString('es-PE');
  win.document.open();
  win.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${htmlEscape(title)}</title>
        <style>
          @page { size: A4; margin: 14mm; }
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #1a202c; }
          h1 { margin: 0 0 6px 0; font-size: 18px; }
          .sub { margin: 0 0 14px 0; color: #4a5568; font-size: 12px; }
          .meta { margin: 0 0 18px 0; color: #718096; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background: #f7fafc; font-weight: 800; }
          .section { margin-top: 18px; }
          .section h2 { font-size: 14px; margin: 0 0 10px 0; color: #1e3a5f; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }
          .ok { background: rgba(39,103,73,.12); color: #276749; }
          .warn { background: rgba(116,66,16,.12); color: #744210; }
          .info { background: rgba(30,58,95,.1); color: #1e3a5f; }
          .danger { background: rgba(162,45,45,.12); color: #a32d2d; }
        </style>
      </head>
      <body>
        <h1>${htmlEscape(title)}</h1>
        ${subtitle ? `<p class="sub">${htmlEscape(subtitle)}</p>` : ''}
        <p class="meta">Generado: ${htmlEscape(now)}</p>
        ${bodyHtml}
        <script>
          setTimeout(() => { window.print(); }, 350);
        </script>
      </body>
    </html>
  `);
  win.document.close();
}

// Mini chart usando Canvas sin Chart.js (fallback SVG para barras simples)
function BarChart({ data = [], valueKey = 'value', labelKey = 'label', color = COLORS.blue }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: color, borderRadius: 4, barThickness: 32 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (!data.length) {
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update('none');
      return;
    }
    chart.data.labels = data.map(d => d[labelKey]);
    chart.data.datasets[0].data = data.map(d => d[valueKey]);
    chart.data.datasets[0].backgroundColor = color;
    chart.update('none');
  }, [data, valueKey, labelKey, color]);
  if (!data.length) return <p style={{ color: '#a0aec0', fontSize: 13, padding: 20 }}>Sin datos</p>;
  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function LineChart({ datasets = [], labels = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
        scales: {
          y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 11 } } },
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update('none');
  }, [datasets, labels]);

  return (
    <div style={{ width: '100%', height: 200, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function DonutChart({ data = [], labels = [], colors = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: colors, borderWidth: 0, hoverOffset: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        animation: false,
        plugins: { legend: { display: false } },
      },
    });
    didInitRef.current = true;
    return () => {
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = null;
      didInitRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update('none');
  }, [data, labels, colors]);

  return (
    <div style={{ width: '100%', height: 180, position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function KpiCard({ label, value, unit = '', delta, deltaUp = true, color }) {
  return (
    <div style={{ background: 'var(--bg-card, #fff)', border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: 0 }} />
      <div style={{ paddingLeft: 10 }}>
        <div style={{ fontSize: 12, color, fontWeight: 500, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 26, fontWeight: 500, color, lineHeight: 1 }}>{value}{unit}</div>
        {delta && (
          <div style={{
            display: 'inline-block', marginTop: 6, padding: '2px 7px', borderRadius: 4, fontSize: 11,
            background: deltaUp ? 'rgba(39,103,73,.12)' : 'rgba(162,45,45,.12)',
            color: deltaUp ? '#276749' : '#a32d2d',
          }}>{delta}</div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', width: 130, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .6s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 36, textAlign: 'right', color }}>{value}%</span>
    </div>
  );
}

function Badge({ type = 'info', children }) {
  const styles = {
    ok: { background: 'rgba(39,103,73,.12)', color: '#276749' },
    warn: { background: 'rgba(116,66,16,.12)', color: '#744210' },
    info: { background: 'rgba(30,58,95,.1)', color: '#1e3a5f' },
    danger: { background: 'rgba(162,45,45,.12)', color: '#a32d2d' },
  };
  return (
    <span style={{ ...styles[type], padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, display: 'inline-block' }}>{children}</span>
  );
}

const TABS = ['overview', 'facultad', 'prediccion', 'reporte', 'mapa', 'encuestas'];
const TAB_LABELS = ['Resumen general', 'Por facultad', 'Predicción tendencias', 'Reportes SUNEDU', 'Mapa laboral', 'Encuestas'];

// ─── Datos mock (reemplazar con llamadas a api.get cuando implementes el back) ───
const MOCK_KPIS   = { total_egresados: 6, empleados: 5, ofertas_activas: 1, postulaciones_mes: 1 };
const MOCK_TEND   = [
  { anio: 2022, tasa_empleabilidad: 80, salario_promedio: 3100, tiempo_promedio: 4.8 },
  { anio: 2023, tasa_empleabilidad: 83, salario_promedio: 3350, tiempo_promedio: 4.2 },
  { anio: 2024, tasa_empleabilidad: 88, salario_promedio: 3700, tiempo_promedio: 3.8 },
];
const MOCK_ENCPEND = [
  { id_encuesta: 'f1000000-0000-0000-0000-000000000001', nombre: 'Seguimiento 1 año — 2024' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis]           = useState(MOCK_KPIS);
  const [tendencias, setTend]     = useState(MOCK_TEND);
  const [encPend, setEncPend]     = useState(MOCK_ENCPEND);
  const [postulaciones, setPostulaciones] = useState([]);
  const [facultades, setFacultades] = useState([]);
  const [facultadId, setFacultadId] = useState('');
  const [anioFacultad, setAnioFacultad] = useState(String(new Date().getFullYear()));
  const [facultadData, setFacultadData] = useState({ escuelas: [], tendencia: [] });
  const [metrica, setMetrica]     = useState('tasa');
  const [loading, setLoading]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [encuestasAdmin, setEncuestasAdmin] = useState([]);
  const [encuestaSel, setEncuestaSel] = useState('');
  const [newEncuesta, setNewEncuesta] = useState({ nombre: '', descripcion: '', tipo: '1_anio', activa: true });
  const [editEncuesta, setEditEncuesta] = useState({ nombre: '', descripcion: '', tipo: '1_anio', activa: true });
  const [preguntasAdmin, setPreguntasAdmin] = useState([]);
  const [editPreguntaId, setEditPreguntaId] = useState('');
  const [pregForm, setPregForm] = useState({ texto:'', tipo_respuesta:'texto', requerida:true, opcionesText:'', orden:'' });
  const [newPreg, setNewPreg] = useState({ texto:'', tipo_respuesta:'texto', requerida:true, opcionesText:'', orden:'' });
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const navigate = useNavigate();

  // ── cuando implementes el back, descomenta esto: ──────────────────────────────
  // useEffect(() => {
  //   Promise.all([
  //     api.get('/api/dashboard/tendencias'),
  //     api.get('/api/encuestas/pendientes').catch(() => ({ data: { data: [] } })),
  //   ]).then(([dash, enc]) => {
  //     setKpis(dash.data.data?.kpis);
  //     setTend(dash.data.data?.tendencias || []);
  //     setEncPend(enc.data.data || []);
  //   }).catch(() => navigate('/login'))
  //   .finally(() => setLoading(false));
  // }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  const refreshEncuestasAdmin = async (preferredId) => {
    const r = await api.get('/api/encuestas');
    const list = r.data.data || [];
    setEncuestasAdmin(list);
    const wanted = preferredId || encuestaSel;
    const exists = wanted && list.some(e => e.id_encuesta === wanted);
    const nextId = exists ? wanted : (list[0]?.id_encuesta || '');
    setEncuestaSel(nextId);
    const sel = list.find(e => e.id_encuesta === nextId);
    if (sel) setEditEncuesta({ nombre: sel.nombre || '', descripcion: sel.descripcion || '', tipo: sel.tipo || '1_anio', activa: !!sel.activa });
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      api.get('/api/dashboard/tendencias'),
      api.get('/api/encuestas/pendientes').catch(() => ({ data: { data: [] } })),
      api.get('/api/catalogo/facultades').catch(() => ({ data: { data: [] } })),
      api.get('/api/reportes/postulaciones?limit=5').catch(() => ({ data: { data: [] } })),
      api.get('/api/encuestas').catch(() => ({ data: { data: [] } })),
    ]).then(([dash, enc, facs, posts, encsAdmin]) => {
      if (!alive) return;
      setKpis(dash.data.data?.kpis || MOCK_KPIS);
      setTend(dash.data.data?.tendencias || MOCK_TEND);
      setEncPend(enc.data.data || MOCK_ENCPEND);
      setFacultades(facs.data.data || []);
      const listPosts = posts.data.data || [];
      setPostulaciones(listPosts);
      const listEnc = encsAdmin.data.data || [];
      setEncuestasAdmin(listEnc);
      const nextId = encuestaSel || listEnc[0]?.id_encuesta || '';
      setEncuestaSel(nextId);
      const sel = listEnc.find(e => e.id_encuesta === nextId);
      if (sel) setEditEncuesta({ nombre: sel.nombre || '', descripcion: sel.descripcion || '', tipo: sel.tipo || '1_anio', activa: !!sel.activa });
      if (!facultadId && (facs.data.data || []).length) {
        setFacultadId(facs.data.data[0].id_facultad);
      }
    }).catch(() => {
      if (!alive) return;
      setKpis(MOCK_KPIS);
      setTend(MOCK_TEND);
      setEncPend(MOCK_ENCPEND);
    }).finally(() => {
      if (!alive) return;
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    if (!encuestaSel) return;
    api.get(`/api/encuestas/${encuestaSel}/preguntas`)
      .then(r => { if (alive) setPreguntasAdmin(r.data.data || []); })
      .catch(() => { if (alive) setPreguntasAdmin([]); });
    return () => { alive = false; };
  }, [encuestaSel]);

  useEffect(() => {
    const sel = encuestasAdmin.find(e => e.id_encuesta === encuestaSel);
    if (sel) setEditEncuesta({ nombre: sel.nombre || '', descripcion: sel.descripcion || '', tipo: sel.tipo || '1_anio', activa: !!sel.activa });
  }, [encuestaSel, encuestasAdmin]);

  useEffect(() => {
    let alive = true;
    if (!facultadId) return;
    api.get(`/api/dashboard/facultad/${facultadId}?anio=${encodeURIComponent(anioFacultad)}`)
      .then(r => { if (alive) setFacultadData(r.data.data || { escuelas: [], tendencia: [] }); })
      .catch(() => { if (alive) setFacultadData({ escuelas: [], tendencia: [] }); });
    return () => { alive = false; };
  }, [facultadId, anioFacultad]);

  const logout = () => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    navigate('/login');
  };

  const exportPostulacionesPdf = async () => {
    setExporting(true);
    try {
      await downloadFromApi(api, '/api/reportes/pdf/postulaciones', 'postulaciones.pdf');
    } finally {
      setExporting(false);
    }
  };

  const exportOverviewPdf = async () => {
    await downloadFromApi(api, '/api/reportes/pdf/resumen', 'resumen.pdf');
  };

  const exportFacultad = async () => {
    if (!facultadId) return;
    const qs = new URLSearchParams({ facultad: facultadId, anio: anioFacultad });
    await downloadFromApi(api, `/api/reportes/pdf/facultad?${qs.toString()}`, `facultad_${anioFacultad}.pdf`);
  };

  const exportEncuestaPdf = async () => {
    if (!encuestaSel) return;
    const qs = new URLSearchParams({ id_encuesta: encuestaSel });
    await downloadFromApi(api, `/api/reportes/pdf/encuesta?${qs.toString()}`, 'encuesta_preguntas.pdf');
  };

  const exportOverviewEscuelasCsv = () => {
    const rows = escuelas.map(e => ({ escuela: e.n, empleabilidad: e.v }));
    const header = ['escuela', 'empleabilidad'];
    const csv = [header.join(','), ...rows.map(r => header.map(h => csvEscape(r[h])).join(','))].join('\n');
    downloadTextFile('empleabilidad_por_escuela.csv', csv, 'text/csv;charset=utf-8');
  };

  const exportCsvByTab = async () => {
    if (activeTab === 'overview') {
      const rows = (postulaciones || []).map(p => ({
        egresado: `${p.nombres || ''} ${p.apellidos || ''}`.trim(),
        email: p.email || '',
        empresa: p.empresa || '',
        oferta: p.titulo || '',
        estado: p.estado || '',
        match: p.puntaje_match ?? '',
        fecha: p.fecha_postulacion ? new Date(p.fecha_postulacion).toISOString() : '',
      }));
      const header = ['egresado','email','empresa','oferta','estado','match','fecha'];
      const csv = [header.join(','), ...rows.map(r => header.map(h => csvEscape(r[h])).join(','))].join('\n');
      downloadTextFile('postulaciones.csv', csv, 'text/csv;charset=utf-8');
      return;
    }
    if (activeTab === 'facultad') {
      const rows = (facultadData.escuelas || []).map(e => ({
        escuela: e.nombre || '',
        empleabilidad: e.tasa ?? '',
        salario_promedio: e.salario ?? '',
      }));
      const header = ['escuela','empleabilidad','salario_promedio'];
      const csv = [header.join(','), ...rows.map(r => header.map(h => csvEscape(r[h])).join(','))].join('\n');
      downloadTextFile(`facultad_${anioFacultad}.csv`, csv, 'text/csv;charset=utf-8');
      return;
    }
    downloadTextFile(`reporte_${activeTab}.txt`, `Reporte: ${activeTab}`, 'text/plain;charset=utf-8');
  };

  const exportPdfByTab = async () => {
    if (activeTab === 'overview') return exportOverviewPdf();
    if (activeTab === 'facultad') return exportFacultad();
    if (activeTab === 'encuestas') return exportEncuestaPdf();
    if (activeTab === 'prediccion') return downloadFromApi(api, '/api/reportes/pdf/prediccion', 'prediccion.pdf');
    if (activeTab === 'reporte') return downloadFromApi(api, '/api/reportes/pdf/sunedu', 'sunedu.pdf');
    if (activeTab === 'mapa') return downloadFromApi(api, '/api/reportes/pdf/mapa', 'mapa.pdf');
    return downloadFromApi(api, `/api/reportes/pdf/${activeTab}`, `${activeTab}.pdf`);
  };

  const parseOpciones = (text) => {
    const t = (text || '').trim();
    if (!t) return null;
    const parts = t.split('\n').map(s => s.trim()).filter(Boolean);
    return parts.length ? parts : null;
  };

  const refreshPreguntas = async (idEnc = encuestaSel) => {
    if (!idEnc) return;
    const r = await api.get(`/api/encuestas/${idEnc}/preguntas`);
    setPreguntasAdmin(r.data.data || []);
  };

  const createEncuesta = async () => {
    if (!newEncuesta.nombre.trim()) return;
    const payload = { nombre: newEncuesta.nombre.trim(), descripcion: (newEncuesta.descripcion || '').trim() || null, tipo: newEncuesta.tipo };
    const r = await api.post('/api/encuestas', payload);
    const id = r.data.data?.id_encuesta;
    setNewEncuesta({ nombre: '', descripcion: '', tipo: newEncuesta.tipo, activa: true });
    await refreshEncuestasAdmin(id);
    if (id) await refreshPreguntas(id);
  };

  const updateEncuesta = async () => {
    if (!encuestaSel) return;
    const payload = { nombre: editEncuesta.nombre, descripcion: editEncuesta.descripcion, tipo: editEncuesta.tipo, activa: !!editEncuesta.activa };
    await api.put(`/api/encuestas/${encuestaSel}`, payload);
    await refreshEncuestasAdmin(encuestaSel);
  };

  const toggleEncuestaActiva = async () => {
    if (!encuestaSel) return;
    await api.patch(`/api/encuestas/${encuestaSel}/activa`, {});
    await refreshEncuestasAdmin(encuestaSel);
  };

  const deleteEncuesta = async () => {
    if (!encuestaSel) return;
    const ok = window.confirm('¿Eliminar encuesta? Solo se podrá eliminar si no tiene respuestas.');
    if (!ok) return;
    await api.delete(`/api/encuestas/${encuestaSel}`);
    setPreguntasAdmin([]);
    await refreshEncuestasAdmin('');
  };

  const startEditPregunta = (p) => {
    const opts = p.opciones ? (typeof p.opciones === 'string' ? JSON.parse(p.opciones) : p.opciones) : null;
    setEditPreguntaId(p.id_pregunta);
    setPregForm({
      texto: p.texto || '',
      tipo_respuesta: p.tipo_respuesta || 'texto',
      requerida: !!p.requerida,
      opcionesText: Array.isArray(opts) ? opts.join('\n') : '',
      orden: p.orden ?? '',
    });
  };

  const cancelEditPregunta = () => {
    setEditPreguntaId('');
    setPregForm({ texto:'', tipo_respuesta:'texto', requerida:true, opcionesText:'', orden:'' });
  };

  const saveEditPregunta = async () => {
    if (!editPreguntaId) return;
    const payload = {
      texto: pregForm.texto,
      tipo_respuesta: pregForm.tipo_respuesta,
      requerida: !!pregForm.requerida,
      orden: pregForm.orden ? Number(pregForm.orden) : undefined,
      opciones: parseOpciones(pregForm.opcionesText),
    };
    await api.put(`/api/encuestas/preguntas/${editPreguntaId}`, payload);
    cancelEditPregunta();
    await refreshPreguntas();
  };

  const togglePregunta = async (p) => {
    await api.patch(`/api/encuestas/preguntas/${p.id_pregunta}/habilitada`, { habilitada: !p.habilitada });
    await refreshPreguntas();
  };

  const deletePregunta = async (p) => {
    await api.delete(`/api/encuestas/preguntas/${p.id_pregunta}`);
    await refreshPreguntas();
  };

  const addPregunta = async () => {
    if (!encuestaSel) return;
    if (!newPreg.texto.trim()) return;
    const payload = {
      texto: newPreg.texto,
      tipo_respuesta: newPreg.tipo_respuesta,
      requerida: !!newPreg.requerida,
      orden: newPreg.orden ? Number(newPreg.orden) : undefined,
      opciones: parseOpciones(newPreg.opcionesText),
    };
    await api.post(`/api/encuestas/${encuestaSel}/preguntas`, payload);
    setNewPreg({ texto:'', tipo_respuesta:'texto', requerida:true, opcionesText:'', orden:'' });
    await refreshPreguntas();
  };

  const METRICA_MAP = {
    tasa:    { label: 'Empleabilidad (%)',    key: 'tasa_empleabilidad', color: COLORS.blue },
    salario: { label: 'Salario prom. (S/.)',  key: 'salario_promedio',   color: COLORS.green },
    tiempo:  { label: 'Tiempo empleo (m)',    key: 'tiempo_promedio',    color: COLORS.amber },
  };

  const mainBarData = tendencias.map(d => ({
    label: String(d.anio),
    value: parseFloat(d[METRICA_MAP[metrica].key]) || 0,
  }));

  const escuelas = [
    { n: 'Ing. Informática', v: 88, c: COLORS.blue },
    { n: 'Ing. Industrial',  v: 78, c: COLORS.green },
    { n: 'Administración',   v: 74, c: COLORS.purple },
    { n: 'Ing. Civil',       v: 71, c: COLORS.amber },
    { n: 'Economía',         v: 68, c: COLORS.teal },
    { n: 'Medicina',         v: 82, c: COLORS.green },
  ];

  const demanda = [
    { n: 'Machine Learning', v: 92 }, { n: 'Cloud AWS',  v: 87 },
    { n: 'React / Vue',      v: 83 }, { n: 'Python Data', v: 81 },
    { n: 'Power BI',         v: 74 }, { n: 'Docker',      v: 68 },
  ];

  const peruOutlinePath = 'M112 12 L135 20 L150 40 L145 55 L160 78 L150 92 L168 120 L155 148 L166 178 L150 215 L138 245 L120 266 L100 255 L86 270 L64 246 L74 215 L58 190 L64 160 L52 132 L64 110 L58 88 L74 68 L70 48 L86 30 Z';
  const mapaRegiones = [
    { name: 'Tumbes', n: 3, x: 112, y: 34 },
    { name: 'Piura', n: 8, x: 96, y: 52 },
    { name: 'Cajamarca', n: 5, x: 132, y: 62 },
    { name: 'La Libertad', n: 147, x: 112, y: 90 },
    { name: 'Áncash', n: 12, x: 106, y: 118 },
    { name: 'Lima', n: 89, x: 112, y: 146 },
    { name: 'Arequipa', n: 23, x: 118, y: 206 },
    { name: 'Otras regiones', n: 20, x: 104, y: 236 },
  ];
  const maxMapa = Math.max(1, ...mapaRegiones.map(r => r.n));
  const topRegionesCards = [['La Libertad', 147], ['Lima', 89], ['Arequipa', 23], ['Áncash', 12], ['Piura', 8], ['Exterior', 6]];

  const yearOptions = Array.from(
    new Set([String(new Date().getFullYear()), ...tendencias.map(t => String(t.anio))])
  ).sort((a, b) => Number(b) - Number(a));

  const facName = (facultades.find(f => f.id_facultad === facultadId)?.nombre) || 'Facultad';
  const facEscuelas = facultadData.escuelas || [];
  const facTend = facultadData.tendencia || [];
  const facCount = facEscuelas.length;
  const facEmpleaAvg = facCount ? (facEscuelas.reduce((s, e) => s + Number(e.tasa || 0), 0) / facCount) : 0;
  const bestEscuela = facEscuelas[0];
  const facSalarioAvg = facCount ? Math.round(facEscuelas.reduce((s, e) => s + Number(e.salario || 0), 0) / facCount) : 0;
  const facTiempo = facTend[0]?.tiempo_promedio_empleo ? Number(facTend[0].tiempo_promedio_empleo).toFixed(1) : '';

  const S = {
    shell:   { minHeight: '100vh', background: '#f0f4f8', fontFamily: 'system-ui, sans-serif' },
    content: { padding: 24, maxWidth: 1200, margin: '0 auto' },
    card:    { background: '#fff', border: '0.5px solid rgba(0,0,0,.08)', borderRadius: 12, padding: 20 },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 },
    row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 },
    row3:    { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 },
    cardH:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    cardT:   { fontSize: 14, fontWeight: 500, color: '#1a202c' },
    chip:    (sel) => ({ padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `0.5px solid ${sel ? COLORS.blue : 'rgba(0,0,0,.15)'}`, background: sel ? COLORS.blue : '#fff', color: sel ? '#fff' : '#718096', marginLeft: 4 }),
    tabSub:  { display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' },
    tabItem: (sel) => ({ padding: '6px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: `0.5px solid ${sel ? 'rgba(0,0,0,.15)' : 'rgba(0,0,0,.06)'}`, background: sel ? '#fff' : 'transparent', color: sel ? '#1a202c' : '#718096', fontWeight: sel ? 500 : 400 }),
    table:   { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th:      { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 500, color: '#718096', borderBottom: '0.5px solid rgba(0,0,0,.06)' },
    td:      { padding: '9px 10px', borderBottom: '0.5px solid rgba(0,0,0,.04)', color: '#1a202c' },
    alertBox:{ background: 'rgba(116,66,16,.06)', border: '0.5px solid rgba(116,66,16,.2)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    btnSm:   { padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: '0.5px solid rgba(0,0,0,.15)', background: '#fff', color: '#1a202c' },
    btnPri:  { padding: '5px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', border: 'none', background: COLORS.blue, color: '#fff', fontWeight: 500 },
    predCard:{ background: 'rgba(0,0,0,.03)', borderRadius: 8, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 },
    predIcon:{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 500 },
    suneduG: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    suneduI: (c) => ({ background: 'rgba(0,0,0,.02)', borderRadius: 8, padding: 12, borderLeft: `3px solid ${c}` }),
    encRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '0.5px solid rgba(0,0,0,.05)' },
    mapGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    regCard: { background: 'rgba(0,0,0,.03)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    sectionT:{ fontSize: 18, fontWeight: 500, color: '#1a202c', marginBottom: 6 },
    sectionS:{ fontSize: 13, color: '#718096', marginBottom: 20 },
  };

  return (
    <div style={S.shell}>
      <div style={S.content}>
        {/* Alert encuestas pendientes */}
        {encPend.length > 0 && (
          <div style={S.alertBox}>
            <span style={{ fontSize: 13, color: COLORS.amber, fontWeight: 500 }}>
              Tienes {encPend.length} encuesta{encPend.length > 1 ? 's' : ''} pendiente{encPend.length > 1 ? 's' : ''} de responder
            </span>
            <button style={S.btnPri} onClick={() => navigate('/encuesta/' + encPend[0].id_encuesta)}>
              Responder ahora →
            </button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={S.tabSub}>
            {TABS.map((t, i) => (
              <button key={t} style={S.tabItem(activeTab === t)} onClick={() => setActiveTab(t)}>
                {TAB_LABELS[i]}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={S.btnSm} onClick={exportCsvByTab} disabled={exporting}>Exportar CSV</button>
            <button style={S.btnPri} onClick={exportPdfByTab} disabled={exporting}>{exporting ? 'Generando...' : 'Exportar PDF'}</button>
          </div>
        </div>

        {/* ── TAB: RESUMEN ── */}
        {activeTab === 'overview' && (
          <>
            <div style={S.kpiGrid}>
              <KpiCard label="Total egresados" value={kpis?.total_egresados || 0} color={COLORS.blue}  delta="+12% vs 2023" deltaUp />
              <KpiCard label="Empleabilidad"   value={`${Math.round((kpis?.empleados / kpis?.total_egresados) * 100) || 0}%`} color={COLORS.green}  delta="+3.5 pts vs 2023" deltaUp />
              <KpiCard label="Salario prom."   value="S/. 3,450" color={COLORS.amber}  delta="+8.2% vs 2023" deltaUp />
              <KpiCard label="Tiempo empleo"   value="3.8m"     color={COLORS.purple} delta="−0.4m mejora" deltaUp />
            </div>
            <div style={S.row3}>
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={S.cardT}>Tendencia histórica</span>
                  <div>
                    {['tasa','salario','tiempo'].map(m => (
                      <span key={m} style={S.chip(metrica === m)} onClick={() => setMetrica(m)}>
                        {m === 'tasa' ? 'Empleabilidad' : m === 'salario' ? 'Salario' : 'Tiempo'}
                      </span>
                    ))}
                  </div>
                </div>
                <BarChart data={mainBarData} valueKey="value" labelKey="label" color={METRICA_MAP[metrica].color} />
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Por sector</span></div>
                <DonutChart
                  data={[42,25,18,15]}
                  labels={['Tecnología','Manufactura','Servicios','Otros']}
                  colors={[COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple]}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {[['Tecnología','#1e3a5f','42%'],['Manufactura','#276749','25%'],['Servicios','#744210','18%'],['Otros','#553c9a','15%']].map(([l,c,v]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#718096' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'inline-block' }} />
                      {l} {v}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Empleabilidad por escuela</span><button style={S.btnSm} onClick={exportOverviewEscuelasCsv}>Exportar</button></div>
                {escuelas.map(e => <ProgressBar key={e.n} label={e.n} value={e.v} color={e.c} />)}
              </div>
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={S.cardT}>Últimas postulaciones</span>
                  <button style={S.btnPri} onClick={exportPostulacionesPdf} disabled={exporting}>{exporting ? 'Generando...' : 'PDF'}</button>
                </div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Egresado</th><th style={S.th}>Oferta</th><th style={S.th}>Estado</th><th style={S.th}>Match</th></tr></thead>
                  <tbody>
                    {(postulaciones || []).length ? (postulaciones || []).map((p) => {
                      const badgeType = p.estado === 'aceptado' ? 'ok' : p.estado === 'rechazado' ? 'danger' : p.estado === 'revision' ? 'warn' : 'info';
                      const match = (p.puntaje_match ?? '') === '' ? '' : `${p.puntaje_match}%`;
                      return (
                        <tr key={p.id_postulacion}>
                          <td style={S.td}>{`${p.nombres || ''} ${p.apellidos || ''}`.trim()}</td>
                          <td style={S.td}>{p.titulo}</td>
                          <td style={S.td}><Badge type={badgeType}>{p.estado}</Badge></td>
                          <td style={S.td}><strong>{match}</strong></td>
                        </tr>
                      );
                    }) : (
                      <tr><td style={S.td} colSpan={4}>Sin postulaciones</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: FACULTAD ── */}
        {activeTab === 'facultad' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#718096' }}>Facultad:</span>
              <select
                value={facultadId}
                onChange={(e) => setFacultadId(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, minWidth: 240 }}
              >
                {facultades.length ? facultades.map((f) => (
                  <option key={f.id_facultad} value={f.id_facultad}>{f.nombre}</option>
                )) : <option value="">Cargando...</option>}
              </select>
              <span style={{ fontSize: 12, color: '#718096' }}>Año:</span>
              <select
                value={anioFacultad}
                onChange={(e) => setAnioFacultad(e.target.value)}
                style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
              >
                {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={S.kpiGrid}>
              <KpiCard label="Facultad" value={facName} color={COLORS.blue} />
              <KpiCard label="Empleabilidad (prom.)" value={`${facEmpleaAvg.toFixed(1)}%`} color={COLORS.green} />
              <KpiCard label={`Mejor: ${bestEscuela?.nombre || '—'}`} value={`${Number(bestEscuela?.tasa || 0).toFixed(1)}%`} color={COLORS.amber} />
              <KpiCard label="Salario prom." value={facSalarioAvg ? `S/. ${facSalarioAvg.toLocaleString('es-PE')}` : '—'} color={COLORS.purple} delta={facTiempo ? `Tiempo prom.: ${facTiempo}m` : ''} deltaUp />
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Comparativa de escuelas — Empleabilidad (%)</span></div>
                <BarChart
                  data={facEscuelas.slice(0, 10).map(e => ({ label: e.nombre, value: Number(e.tasa || 0) }))}
                  valueKey="value" labelKey="label" color={COLORS.blue}
                />
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Detalle {anioFacultad}</span></div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Escuela</th><th style={S.th}>Emplea.</th><th style={S.th}>Salario</th><th style={S.th}>T.Empleo</th></tr></thead>
                  <tbody>
                    {facEscuelas.length ? facEscuelas.slice(0, 12).map((e) => {
                      const tasa = Number(e.tasa || 0);
                      const badge = tasa >= 85 ? 'ok' : tasa >= 70 ? 'warn' : 'danger';
                      return (
                        <tr key={e.id_escuela}>
                          <td style={S.td}>{e.nombre}</td>
                          <td style={S.td}><Badge type={badge}>{tasa.toFixed(1)}%</Badge></td>
                          <td style={S.td}>{e.salario ? `S/. ${Number(e.salario).toLocaleString('es-PE')}` : '—'}</td>
                          <td style={S.td}>{facTiempo ? `${facTiempo}m` : '—'}</td>
                        </tr>
                      );
                    }) : <tr><td style={S.td} colSpan={4}>Sin datos para los filtros seleccionados</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: PREDICCIÓN ── */}
        {activeTab === 'prediccion' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Predicción de tendencias ocupacionales</div>
              <div style={S.sectionS}>Proyección 2025–2027 basada en datos históricos y análisis de mercado laboral regional</div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}>
                  <span style={S.cardT}>Proyección de empleabilidad 2025–2027</span>
                  <Badge type="info">IA Beta</Badge>
                </div>
                <LineChart
                  labels={['2020','2021','2022','2023','2024','2025*','2026*','2027*']}
                  datasets={[
                    { label: 'Histórico', data: [74,77,80,78,83,null,null,null], borderColor: COLORS.blue, backgroundColor: 'rgba(30,58,95,.08)', fill: true, tension: .4, pointRadius: 4 },
                    { label: 'Proyección', data: [null,null,null,null,83,87,89,91], borderColor: COLORS.green, backgroundColor: 'rgba(39,103,73,.08)', fill: true, tension: .4, pointRadius: 4, borderDash: [5,5] },
                  ]}
                />
                <div style={{ marginTop: 10, fontSize: 12, color: '#718096' }}>Basado en 847 registros históricos — Confianza: 82%</div>
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Habilidades más demandadas 2025</span></div>
                {demanda.map(d => <ProgressBar key={d.n} label={d.n} value={d.v} color={COLORS.blue} />)}
              </div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Alertas de mercado</span></div>
                {[
                  { icon: '↓', iconBg: 'rgba(162,45,45,.1)', title: 'Ing. Civil — demanda bajando', sub: 'Sector construcción reduce 12% en proyecciones 2025' },
                  { icon: '↑', iconBg: 'rgba(39,103,73,.1)', title: 'Ciencia de datos — alta demanda', sub: 'Crecimiento +34% sector tecnología La Libertad' },
                  { icon: '★', iconBg: 'rgba(30,58,95,.1)', title: 'Trabajo remoto — 40% de ofertas', sub: 'Informática lidera empleabilidad remota en la región' },
                ].map((a,i) => (
                  <div key={i} style={S.predCard}>
                    <div style={{ ...S.predIcon, background: a.iconBg }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{a.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Recomendaciones curriculares</span></div>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Carrera</th><th style={S.th}>Agregar al plan</th><th style={S.th}>Impacto</th></tr></thead>
                  <tbody>
                    {[['Informática','Cloud AWS/Azure','ok'],['Industrial','Lean + IA','ok'],['Administración','Analítica datos','info'],['Economía','Power BI + Python','ok'],['Civil','BIM Revit','info']].map(([c,t,b]) => (
                      <tr key={c}><td style={S.td}>{c}</td><td style={S.td}>{t}</td><td style={S.td}><Badge type={b}>{b==='ok'?'Alto':'Medio'}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: REPORTES SUNEDU ── */}
        {activeTab === 'reporte' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Reportes para SUNEDU y acreditadoras</div>
              <div style={S.sectionS}>Generación automática en formato estándar — Resolución SUNEDU N° 012-2024</div>
            </div>
            <div style={S.row2}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Plantillas disponibles</span></div>
                <div style={S.suneduG}>
                  {[
                    { title: 'Informe SUNEDU', sub: 'Seguimiento de graduados anual', c: COLORS.blue, btn: 'Generar PDF', pri: true },
                    { title: 'SINEACE',         sub: 'Acreditación empleabilidad',     c: COLORS.green, btn: 'Generar PDF', pri: true },
                    { title: 'Reporte Decano',  sub: 'Dashboard ejecutivo',            c: COLORS.amber, btn: 'Generar XLSX', pri: false },
                    { title: 'Datos abiertos',  sub: 'Exportar dataset',               c: COLORS.purple, btn: 'Descargar CSV', pri: false },
                  ].map(item => (
                    <div key={item.title} style={S.suneduI(item.c)}>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: '#718096', marginBottom: 10 }}>{item.sub}</div>
                      <button style={item.pri ? S.btnPri : S.btnSm}>{item.btn}</button>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Estado de encuestas</span></div>
                {[
                  { t: 'Seguimiento 1 año — 2024',  r: 34, e: 45, badge: 'warn', p: '75.6%' },
                  { t: 'Seguimiento 3 años — 2024', r: 28, e: 30, badge: 'ok',   p: '93.3%' },
                  { t: 'Seguimiento 5 años — 2023', r: 22, e: 22, badge: 'ok',   p: '100%' },
                ].map((enc,i) => (
                  <div key={i} style={{ ...S.encRow, ...(i === 2 ? { borderBottom: 'none' } : {}) }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{enc.t}</div>
                      <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>Respuestas: {enc.r} / {enc.e}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge type={enc.badge}>{enc.p}</Badge>
                      <button style={S.btnSm}>Ver</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '0.5px solid rgba(0,0,0,.06)' }}>
                  <div style={{ fontSize: 12, color: '#718096', marginBottom: 6 }}>Próximo envío automático</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Encuesta 1 año — Generación 2023</div>
                  <div style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>15 de abril 2026 — 42 destinatarios</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: MAPA ── */}
        {activeTab === 'mapa' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Mapa laboral del Perú</div>
              <div style={S.sectionS}>Distribución geográfica de egresados por región y sector empresarial</div>
            </div>
            <div style={S.row3}>
              <div style={S.card}>
                <div style={S.cardH}><span style={S.cardT}>Concentración por región</span></div>
                <div style={{ width: '100%', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 220 280" style={{ width: '100%', height: '100%', maxWidth: 520 }}>
                    <path d={peruOutlinePath} fill="#e6f1fb" stroke="#2d6a9f" strokeWidth={2} />
                    {mapaRegiones.map((r) => {
                      const t = r.n / maxMapa;
                      const radius = 5 + t * 9;
                      const fill = t > 0.65 ? '#1e3a5f' : t > 0.35 ? '#2d6a9f' : '#85b7eb';
                      const textFill = t > 0.65 ? '#fff' : '#1a365d';
                      return (
                        <g key={r.name}>
                          <circle cx={r.x} cy={r.y} r={radius} fill={fill} opacity={0.92} />
                          <circle cx={r.x} cy={r.y} r={radius + 2} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth={1} />
                          <text x={r.x} y={r.y + 3} textAnchor="middle" fontSize={9} fill={textFill} fontWeight={800}>
                            {r.n}
                          </text>
                          <text x={r.x + 10} y={r.y - 10} fontSize={9} fill="#1a202c" opacity={0.9}>
                            {r.name}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
              <div>
                <div style={{ ...S.card, marginBottom: 16 }}>
                  <div style={S.cardH}><span style={S.cardT}>Top regiones</span></div>
                  <div style={S.mapGrid}>
                    {topRegionesCards.map(([r,n]) => (
                      <div key={r} style={S.regCard}>
                        <span style={{ fontSize: 12, color: '#718096' }}>{r}</span>
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{n}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={S.card}>
                  <div style={S.cardH}><span style={S.cardT}>Sector por región</span></div>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Región</th><th style={S.th}>Sector líder</th><th style={S.th}>%</th></tr></thead>
                    <tbody>
                      {[['La Libertad','Tecnología','38%'],['Lima','Finanzas','41%'],['Arequipa','Minería','55%']].map(([r,s,p]) => (
                        <tr key={r}><td style={S.td}>{r}</td><td style={S.td}>{s}</td><td style={S.td}><strong>{p}</strong></td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: ENCUESTAS ── */}
        {activeTab === 'encuestas' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={S.sectionT}>Gestión de encuestas</div>
              <div style={S.sectionS}>Administra preguntas: agregar, editar, inhabilitar o eliminar. Las preguntas habilitadas son las que aparecen al responder.</div>
            </div>

            {(user.rol || '').toLowerCase() !== 'admin' ? (
              <div style={S.card}>
                <div style={{ fontSize: 13, color: '#718096' }}>Solo administradores pueden gestionar preguntas de encuestas.</div>
              </div>
            ) : (
              <div style={S.row2}>
                <div style={S.card}>
                  <div style={S.cardH}>
                    <span style={S.cardT}>Encuesta</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={S.btnSm} onClick={() => refreshPreguntas()} disabled={!encuestaSel}>Refrescar</button>
                      <button style={S.btnPri} onClick={exportEncuestaPdf} disabled={!encuestaSel}>PDF Preguntas</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}>
                    <select
                      value={encuestaSel}
                      onChange={(e) => setEncuestaSel(e.target.value)}
                      style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, width: '100%' }}
                    >
                      {encuestasAdmin.length ? encuestasAdmin.map((e) => (
                        <option key={e.id_encuesta} value={e.id_encuesta}>{e.activa ? '' : '[INACTIVA] '}{e.nombre}</option>
                      )) : <option value="">Sin encuestas</option>}
                    </select>
                    <button
                      style={S.btnSm}
                      onClick={() => {
                        if (encuestaSel) navigate('/encuesta/' + encuestaSel + '?public=1');
                      }}
                      disabled={!encuestaSel}
                    >
                      Vista previa
                    </button>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid rgba(0,0,0,.06)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a202c', marginBottom: 10 }}>Editar encuesta seleccionada</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: 10 }}>
                      <input
                        value={editEncuesta.nombre}
                        onChange={(e) => setEditEncuesta(v => ({ ...v, nombre: e.target.value }))}
                        placeholder="Nombre de la encuesta"
                        style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                      />
                      <select
                        value={editEncuesta.tipo}
                        onChange={(e) => setEditEncuesta(v => ({ ...v, tipo: e.target.value }))}
                        style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                      >
                        {['1_anio','3_anios','5_anios'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <textarea
                        value={editEncuesta.descripcion || ''}
                        onChange={(e) => setEditEncuesta(v => ({ ...v, descripcion: e.target.value }))}
                        placeholder="Descripción"
                        style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, minHeight: 70, resize: 'vertical' }}
                      />
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#4a5568' }}>
                        <input type="checkbox" checked={!!editEncuesta.activa} onChange={(e) => setEditEncuesta(v => ({ ...v, activa: e.target.checked }))} />
                        Activa
                      </label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button style={S.btnSm} onClick={toggleEncuestaActiva} disabled={!encuestaSel}>Activar/Desactivar</button>
                        <button style={S.btnPri} onClick={updateEncuesta} disabled={!encuestaSel || !editEncuesta.nombre.trim()}>Guardar</button>
                        <button style={{ ...S.btnSm, borderColor: 'rgba(197,48,48,.35)', color: '#c53030' }} onClick={deleteEncuesta} disabled={!encuestaSel}>Eliminar</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid rgba(0,0,0,.06)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a202c', marginBottom: 10 }}>+ Nueva encuesta</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: 10 }}>
                      <input
                        value={newEncuesta.nombre}
                        onChange={(e) => setNewEncuesta(v => ({ ...v, nombre: e.target.value }))}
                        placeholder="Nombre de la encuesta"
                        style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                      />
                      <select
                        value={newEncuesta.tipo}
                        onChange={(e) => setNewEncuesta(v => ({ ...v, tipo: e.target.value }))}
                        style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                      >
                        {['1_anio','3_anios','5_anios'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <textarea
                        value={newEncuesta.descripcion}
                        onChange={(e) => setNewEncuesta(v => ({ ...v, descripcion: e.target.value }))}
                        placeholder="Descripción"
                        style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, minHeight: 70, resize: 'vertical' }}
                      />
                      <button style={S.btnPri} onClick={createEncuesta} disabled={!newEncuesta.nombre.trim()}>Crear encuesta</button>
                      <button style={S.btnSm} onClick={() => refreshEncuestasAdmin()}>Actualizar lista</button>
                    </div>
                  </div>

                  <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, color: '#1a202c' }}>+ Nueva pregunta</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px', gap: 10, marginTop: 10 }}>
                    <input
                      value={newPreg.texto}
                      onChange={(e) => setNewPreg(v => ({ ...v, texto: e.target.value }))}
                      placeholder="Texto de la pregunta"
                      style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                    />
                    <select
                      value={newPreg.tipo_respuesta}
                      onChange={(e) => setNewPreg(v => ({ ...v, tipo_respuesta: e.target.value }))}
                      style={{ padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                    >
                      {['texto','numero','escala','opcion_multiple','verdadero_falso'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <textarea
                      value={newPreg.opcionesText}
                      onChange={(e) => setNewPreg(v => ({ ...v, opcionesText: e.target.value }))}
                      placeholder="Opciones (una por línea, solo para opcion_multiple)"
                      style={{ gridColumn: '1 / -1', padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, minHeight: 70, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#4a5568' }}>
                        <input type="checkbox" checked={!!newPreg.requerida} onChange={(e) => setNewPreg(v => ({ ...v, requerida: e.target.checked }))} />
                        Requerida
                      </label>
                      <input
                        value={newPreg.orden}
                        onChange={(e) => setNewPreg(v => ({ ...v, orden: e.target.value }))}
                        placeholder="Orden"
                        style={{ marginLeft: 'auto', width: 90, padding: '10px 12px', borderRadius: 10, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                      />
                    </div>
                    <button style={S.btnPri} onClick={addPregunta} disabled={!newPreg.texto.trim()}>Agregar</button>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardH}><span style={S.cardT}>Preguntas</span></div>
                  <div style={{ maxHeight: 520, overflow: 'auto' }}>
                    {(preguntasAdmin || []).length ? (
                      <table style={S.table}>
                        <thead>
                          <tr>
                            <th style={S.th}>#</th>
                            <th style={S.th}>Estado</th>
                            <th style={S.th}>Tipo</th>
                            <th style={S.th}>Pregunta</th>
                            <th style={S.th}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {preguntasAdmin.map((p) => {
                            const isEditing = editPreguntaId === p.id_pregunta;
                            return (
                              <tr key={p.id_pregunta}>
                                <td style={S.td}>{p.orden}</td>
                                <td style={S.td}>
                                  <Badge type={p.habilitada === false ? 'danger' : 'ok'}>{p.habilitada === false ? 'Inhabilitada' : 'Habilitada'}</Badge>
                                </td>
                                <td style={S.td}>{p.tipo_respuesta}</td>
                                <td style={S.td}>
                                  {isEditing ? (
                                    <div style={{ display: 'grid', gap: 8 }}>
                                      <input
                                        value={pregForm.texto}
                                        onChange={(e) => setPregForm(v => ({ ...v, texto: e.target.value }))}
                                        style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                                      />
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <select
                                          value={pregForm.tipo_respuesta}
                                          onChange={(e) => setPregForm(v => ({ ...v, tipo_respuesta: e.target.value }))}
                                          style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                                        >
                                          {['texto','numero','escala','opcion_multiple','verdadero_falso'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input
                                          value={pregForm.orden}
                                          onChange={(e) => setPregForm(v => ({ ...v, orden: e.target.value }))}
                                          placeholder="Orden"
                                          style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13 }}
                                        />
                                      </div>
                                      <textarea
                                        value={pregForm.opcionesText}
                                        onChange={(e) => setPregForm(v => ({ ...v, opcionesText: e.target.value }))}
                                        placeholder="Opciones (una por línea)"
                                        style={{ padding: '8px 10px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,.15)', fontSize: 13, minHeight: 70, resize: 'vertical' }}
                                      />
                                      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#4a5568' }}>
                                        <input type="checkbox" checked={!!pregForm.requerida} onChange={(e) => setPregForm(v => ({ ...v, requerida: e.target.checked }))} />
                                        Requerida
                                      </label>
                                      <div style={{ display: 'flex', gap: 8 }}>
                                        <button style={S.btnPri} onClick={saveEditPregunta}>Guardar</button>
                                        <button style={S.btnSm} onClick={cancelEditPregunta}>Cancelar</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: 13, color: '#1a202c' }}>
                                      {p.texto}
                                      {p.requerida && <span style={{ color: '#e53e3e', fontWeight: 900 }}> *</span>}
                                    </div>
                                  )}
                                </td>
                                <td style={S.td}>
                                  {!isEditing && (
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                      <button style={S.btnSm} onClick={() => startEditPregunta(p)}>Editar</button>
                                      <button style={S.btnSm} onClick={() => togglePregunta(p)}>{p.habilitada === false ? 'Habilitar' : 'Inhabilitar'}</button>
                                      <button style={{ ...S.btnSm, borderColor: 'rgba(197,48,48,.35)', color: '#c53030' }} onClick={() => deletePregunta(p)}>Eliminar</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize: 13, color: '#718096' }}>No hay preguntas para esta encuesta.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
