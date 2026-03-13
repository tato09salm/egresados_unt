import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api_seguimiento';

const s = {
  page: { minHeight:'100vh', background:'linear-gradient(135deg,#1a365d 0%,#744210 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  card: { background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:600, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
  progress: { height:6, background:'#e2e8f0', borderRadius:3, marginBottom:28, overflow:'hidden' },
  bar: (pct) => ({ height:'100%', background:'#744210', borderRadius:3, width:`${pct}%`, transition:'width .3s' }),
  pregunta: { fontSize:18, fontWeight:600, color:'#1a365d', marginBottom:24, lineHeight:1.5 },
  opcion: (sel) => ({ display:'block', width:'100%', padding:'12px 18px', border:`2px solid ${sel?'#744210':'#e2e8f0'}`, borderRadius:8, background: sel?'#fffbeb':'#fff', cursor:'pointer', fontSize:14, textAlign:'left', marginBottom:8, fontWeight: sel?600:400, color: sel?'#744210':'#4a5568', transition:'all .15s' }),
  input: { width:'100%', padding:'12px 16px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:16, outline:'none', marginTop:8 },
  btn: { padding:'12px 28px', background:'#744210', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
  btnOut: { padding:'12px 28px', background:'transparent', color:'#744210', border:'1.5px solid #744210', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' },
};

export default function Encuesta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [encuesta, setEncuesta] = useState(null);
  const [step, setStep] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [completada, setCompletada] = useState(false);

  useEffect(() => {
    api.get(`/api/encuestas/${id}`)
      .then(r => setEncuesta(r.data.data))
      .catch(() => navigate('/dashboard'));
  }, [id]);

  if (!encuesta) return <div style={{ color:'#fff', textAlign:'center', padding:80 }}>Cargando...</div>;

  const preguntas = encuesta.preguntas || [];
  const pregunta  = preguntas[step];
  const total     = preguntas.length;
  const pct       = total > 0 ? ((step + 1) / total) * 100 : 0;

  const setResp = (val) => setRespuestas(r => ({ ...r, [pregunta.id_pregunta]: val }));
  const getResp = () => respuestas[pregunta?.id_pregunta];

  const enviar = async () => {
    setEnviando(true);
    try {
      const payload = Object.entries(respuestas).map(([id_pregunta, val]) => {
        const preg = preguntas.find(p => p.id_pregunta === id_pregunta);
        if (preg?.tipo_respuesta === 'numero' || preg?.tipo_respuesta === 'escala')
          return { id_pregunta, valor_numero: parseFloat(val) };
        if (preg?.tipo_respuesta === 'opcion_multiple')
          return { id_pregunta, valor_opciones: [val] };
        return { id_pregunta, valor_texto: String(val) };
      });
      await api.post(`/api/encuestas/${id}/responder`, { respuestas: payload });
      setCompletada(true);
    } catch(e) { alert(e.response?.data?.message || 'Error al enviar'); }
    setEnviando(false);
  };

  if (completada) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:'#1a365d', marginBottom:12 }}>¡Encuesta Completada!</h2>
          <p style={{ color:'#718096', marginBottom:28 }}>Gracias por tu participación. Tus respuestas ayudan a mejorar la calidad educativa de la UNT.</p>
          <button style={s.btn} onClick={() => navigate('/dashboard')}>← Volver al Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'#718096' }}>
          <span>{encuesta.nombre}</span>
          <span>Pregunta {step+1} de {total}</span>
        </div>
        <div style={s.progress}><div style={s.bar(pct)} /></div>

        {pregunta && (
          <div>
            <div style={s.pregunta}>{pregunta.texto}{pregunta.requerida && <span style={{ color:'#e53e3e' }}> *</span>}</div>

            {pregunta.tipo_respuesta === 'opcion_multiple' && pregunta.opciones && (
              <div>
                {(typeof pregunta.opciones === 'string' ? JSON.parse(pregunta.opciones) : pregunta.opciones).map((op, i) => (
                  <button key={i} style={s.opcion(getResp() === op)} onClick={() => setResp(op)}>{op}</button>
                ))}
              </div>
            )}

            {(pregunta.tipo_respuesta === 'texto') && (
              <textarea style={{ ...s.input, resize:'vertical', minHeight:80 }} value={getResp()||''} onChange={e=>setResp(e.target.value)} placeholder="Escribe tu respuesta..." />
            )}

            {pregunta.tipo_respuesta === 'numero' && (
              <input type="number" style={s.input} value={getResp()||''} onChange={e=>setResp(e.target.value)} placeholder="Ingresa un número" />
            )}

            {pregunta.tipo_respuesta === 'escala' && (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setResp(n)}
                    style={{ flex:1, padding:12, border:`2px solid ${getResp()===n?'#744210':'#e2e8f0'}`, borderRadius:8, background:getResp()===n?'#744210':'#fff', color:getResp()===n?'#fff':'#4a5568', cursor:'pointer', fontSize:18, fontWeight:700 }}>
                    {n}
                  </button>
                ))}
              </div>
            )}

            {pregunta.tipo_respuesta === 'verdadero_falso' && (
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                {[true,false].map(v => (
                  <button key={String(v)} style={{ ...s.opcion(getResp()===v), flex:1 }} onClick={() => setResp(v)}>{v ? '✓ Sí / Verdadero' : '✗ No / Falso'}</button>
                ))}
              </div>
            )}

            <div style={{ display:'flex', justifyContent:'space-between', marginTop:32 }}>
              <button style={s.btnOut} onClick={() => setStep(s => s-1)} disabled={step === 0}>← Anterior</button>
              {step < total - 1
                ? <button style={s.btn} onClick={() => setStep(s => s+1)} disabled={pregunta.requerida && !getResp()}>Siguiente →</button>
                : <button style={s.btn} onClick={enviar} disabled={enviando || (pregunta.requerida && !getResp())}>{enviando ? 'Enviando...' : '✓ Finalizar'}</button>
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
