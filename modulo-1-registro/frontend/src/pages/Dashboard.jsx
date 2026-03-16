import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import apiBolsa from '../services/api_bolsa';
import apiMentores from '../services/api_mentores';
import apiSeguimiento from '../services/api_seguimiento';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  const [loading, setLoading] = useState(true);
  const [ofertas, setOfertas] = useState([]);
  const [recomendadas, setRecomendadas] = useState([]);
  const [faqOpen, setFaqOpen] = useState(0);
  const [kpis, setKpis] = useState({
    ofertasActivas: 0,
    postulaciones: 0,
    mentoresDisponibles: 0,
    encuestasPendientes: 0,
  });

  useEffect(() => {
    const cargarDashboard = async () => {
      setLoading(true);
      const isEgresado = user.rol === 'egresado';

      const requests = await Promise.allSettled([
        apiBolsa.get('/api/ofertas?page=1&limit=6'),
        apiMentores.get('/api/mentores?page=1&limit=1'),
        isEgresado ? api.get('/api/egresados/perfil') : Promise.resolve({ data: { data: null } }),
        isEgresado ? apiBolsa.get('/api/postulaciones/mis-postulaciones') : Promise.resolve({ data: { data: [] } }),
        isEgresado ? apiSeguimiento.get('/api/encuestas/pendientes') : Promise.resolve({ data: { data: [] } }),
        isEgresado ? apiBolsa.get('/api/match/recomendaciones') : Promise.resolve({ data: { data: [] } }),
      ]);

      const get = (idx, fallback) => requests[idx].status === 'fulfilled' ? requests[idx].value : fallback;

      const ofertasRes = get(0, { data: { data: [], pagination: { total: 0 } } });
      const mentoresRes = get(1, { data: { data: [], pagination: { total: 0 } } });
      const postulacionesRes = get(3, { data: { data: [] } });
      const encuestasRes = get(4, { data: { data: [] } });
      const recomendacionesRes = get(5, { data: { data: [] } });

      setOfertas(ofertasRes.data?.data || []);
      setRecomendadas(recomendacionesRes.data?.data || []);
      setKpis({
        ofertasActivas: ofertasRes.data?.pagination?.total || 0,
        postulaciones: (postulacionesRes.data?.data || []).length,
        mentoresDisponibles: mentoresRes.data?.pagination?.total || 0,
        encuestasPendientes: (encuestasRes.data?.data || []).length,
      });
      setLoading(false);
    };

    cargarDashboard();
  }, [user.rol]);

  const stats = [
    { label: 'Ofertas activas', value: kpis.ofertasActivas, icon: '💼', color: '#2563eb' },
    { label: 'Mentores disponibles', value: kpis.mentoresDisponibles, icon: '🤝', color: '#7c3aed' },
    { label: 'Postulaciones mias', value: kpis.postulaciones, icon: '📨', color: '#0f766e' },
    { label: 'Encuestas pendientes', value: kpis.encuestasPendientes, icon: '📊', color: '#b45309' },
  ];

  const logros = [
    { titulo: 'Intermediacion laboral', valor: `${kpis.ofertasActivas}+`, detalle: 'vacantes publicadas en bolsa activa' },
    { titulo: 'Mentoria activa', valor: `${kpis.mentoresDisponibles}+`, detalle: 'mentores disponibles para acompanar estudiantes y egresados' },
    { titulo: 'Seguimiento', valor: `${kpis.encuestasPendientes}`, detalle: 'encuestas pendientes para mantener trazabilidad institucional' },
  ];

  const faqs = [
    {
      pregunta: '¿Que puedo hacer desde esta pagina principal?',
      respuesta: 'Puedes acceder rapidamente a tu perfil profesional, buscar ofertas laborales, responder encuestas de seguimiento y conectar con mentores.',
    },
    {
      pregunta: '¿Como mejora mi empleabilidad dentro del sistema?',
      respuesta: 'Mantener actualizado tu perfil y habilidades aumenta la precision del matching de ofertas y mejora tu visibilidad ante empresas.',
    },
    {
      pregunta: '¿Quien puede usar la plataforma SGE-UNT?',
      respuesta: 'La plataforma esta orientada a egresados UNT, administradores institucionales y empresas aliadas validadas.',
    },
    {
      pregunta: '¿Con que frecuencia se actualizan los datos?',
      respuesta: 'Las ofertas y postulaciones se actualizan en tiempo real. Los indicadores de seguimiento se consolidan segun los cortes institucionales.',
    },
  ];

  const s = {
    container: { minHeight: '100vh', background: '#f4f7fb' },
    hero: { 
      background: 'radial-gradient(circle at 10% 20%, #1a365d 0%, #123057 45%, #0f172a 100%)', 
      color: 'white', 
      padding: '50px 20px',
      marginBottom: '30px',
      position: 'relative',
      overflow: 'hidden',
    },
    heroOverlay: { maxWidth: '1100px', margin: '0 auto' },
    welcome: { fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px' },
    sub: { fontSize: '1rem', opacity: 0.92, maxWidth: '680px', lineHeight: 1.5 },
    heroBadges: { marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 10 },
    heroBadge: { background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)', color: '#fff', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 700 },
    content: { maxWidth: '1100px', margin: '0 auto', padding: '0 20px' },
    gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '26px' },
    statCard: { background: '#fff', padding: '18px', borderRadius: '12px', boxShadow: '0 6px 18px rgba(15,23,42,.06)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#123057', marginBottom: '12px' },
    sectionBlock: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:20, marginBottom:20, boxShadow:'0 6px 18px rgba(15,23,42,.05)' },
    quickActions: { display:'flex', flexWrap:'wrap', gap:10, marginBottom:24 },
    quickBtn: { textDecoration:'none', padding:'8px 14px', borderRadius:8, border:'1px solid #cbd5e1', color:'#123057', fontWeight:600, fontSize:13, background:'#f8fafc' },
    split: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:18, marginBottom:24 },
    panel: { background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:18, boxShadow:'0 6px 18px rgba(15,23,42,.05)' },
    offerItem: { padding:'10px 0', borderBottom:'1px dashed #e2e8f0' },
    offerTitle: { fontSize:14, fontWeight:700, color:'#123057' },
    offerMeta: { fontSize:12, color:'#64748b' },
    nosotrosMain: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:14, marginBottom:12 },
    nosotrosGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12 },
    miniCard: { background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:14 },
    logroGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12 },
    logroCard: { background:'linear-gradient(145deg,#ffffff,#eef4ff)', border:'1px solid #dbeafe', borderRadius:12, padding:16 },
    logroNum: { fontSize:28, fontWeight:800, color:'#1d4ed8', lineHeight:1, marginBottom:6 },
    faqItem: { border:'1px solid #e2e8f0', borderRadius:10, marginBottom:10, overflow:'hidden' },
    faqQ: { width:'100%', padding:'12px 14px', textAlign:'left', border:'none', background:'#f8fafc', cursor:'pointer', fontWeight:700, color:'#0f172a' },
    faqA: { padding:'12px 14px', fontSize:14, color:'#475569', background:'#fff' },
    contactGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px,1fr))', gap:12 },
    contactCard: { display:'flex', gap:10, alignItems:'flex-start', background:'#fff', border:'1px solid #dbeafe', borderRadius:12, padding:14 },
    contactIcon: { width:44, height:44, borderRadius:'50%', background:'#1d4ed8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 },
    gridModules: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '50px' },
    moduleCard: { 
      background: '#fff', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 6px 18px rgba(15,23,42,.05)', 
      textDecoration: 'none', 
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      border: '1px solid #e2e8f0'
    },
    footer: { marginTop: 30, background:'linear-gradient(180deg,#274690,#1e3a8a)', color:'#dbeafe', borderTop:'4px solid #1d4ed8' },
    footerWrap: { maxWidth:'1100px', margin:'0 auto', padding:'32px 20px', textAlign:'center' },
    footerLogo: { fontSize:26, fontWeight:900, color:'#fff', marginBottom:12, letterSpacing:.8 },
    footerLine: { width:'100%', borderTop:'1px solid rgba(255,255,255,.35)', margin:'22px 0 14px' },
    footerText: { fontSize:14, lineHeight:1.7 },
    socialRow: { display:'flex', justifyContent:'center', gap:10, marginTop:8 },
    socialIcon: { width:28, height:28, borderRadius:6, border:'1px solid rgba(255,255,255,.5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#fff' },
  };

  const modules = [
    { title:'Mi Perfil Profesional', desc:'Gestiona tu CV inteligente, portafolio y habilidades.', icon:'👤', link:'/perfil', color:'#3182ce' },
    { title:'Bolsa Laboral', desc:'Encuentra oportunidades laborales exclusivas para egresados UNT.', icon:'💼', link:'/bolsa', color:'#38a169' },
    { title:'Seguimiento Egresados', desc:'Participa en encuestas y ayúdanos a mejorar la universidad.', icon:'📊', link:'/seguimiento', color:'#d69e2e' },
    { title:'Red de Mentores', desc:'Conecta con profesionales experimentados o ayuda a otros.', icon:'🤝', link:'/mentores', color:'#805ad5' },
  ];

  return (
    <div style={s.container}>
      <div style={s.hero}>
        <div style={s.heroOverlay}>
          <h1 style={s.welcome}>Bienvenido, {user.nombres?.split(' ')[0] || 'Egresado'}</h1>
          <p style={s.sub}>Panel central de empleabilidad UNT: gestiona tu perfil, postula a ofertas, participa en encuestas y fortalece tu red de mentoria.</p>
          <div style={s.heroBadges}>
            <span style={s.heroBadge}>Rol: {user.rol || 'egresado'}</span>
            <span style={s.heroBadge}>Modulo activo: Plataforma integral</span>
            <span style={s.heroBadge}>Estado: {loading ? 'Sincronizando...' : 'Actualizado'}</span>
          </div>
        </div>
      </div>

      <div style={s.content}>
        <div style={s.gridStats}>
          {stats.map(st => (
            <div key={st.label} style={s.statCard}>
              <span style={{fontSize: '2rem'}}>{st.icon}</span>
              <div>
                <div style={{fontSize: '1.35rem', fontWeight: '800', color: st.color}}>{loading ? '...' : st.value}</div>
                <div style={{fontSize: '0.75rem', color: '#64748b', fontWeight: '700'}}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={s.quickActions}>
          <Link to="/perfil" style={s.quickBtn}>Actualizar perfil</Link>
          <Link to="/bolsa" style={s.quickBtn}>Explorar ofertas</Link>
          <Link to="/seguimiento" style={s.quickBtn}>Responder encuestas</Link>
          <Link to="/mentores" style={s.quickBtn}>Buscar mentor</Link>
          <Link to="/bolsa/postulaciones" style={s.quickBtn}>Ver postulaciones</Link>
        </div>

        <section style={s.sectionBlock}>
          <h2 style={s.sectionTitle}>Nosotros</h2>
          <div style={s.nosotrosMain}>
            <div>
              <h3 style={{ margin:'0 0 6px', color:'#1e3a8a', fontSize:16 }}>¿En qué consiste esta pagina?</h3>
              <p style={{ margin:0, fontSize:14, color:'#475569', lineHeight:1.55 }}>Es el panel central del Sistema de Gestion de Egresados UNT, donde convergen registro profesional, bolsa laboral, seguimiento de empleabilidad y red de mentoria.</p>
            </div>
          </div>
          <div style={s.nosotrosGrid}>
            <div style={s.miniCard}>
              <h3 style={{ margin:'0 0 6px', color:'#1e3a8a', fontSize:16 }}>Mision</h3>
              <p style={{ margin:0, fontSize:14, color:'#475569', lineHeight:1.55 }}>Impulsar la insercion y desarrollo profesional de egresados UNT mediante servicios digitales confiables, integrados y orientados a resultados.</p>
            </div>
            <div style={s.miniCard}>
              <h3 style={{ margin:'0 0 6px', color:'#1e3a8a', fontSize:16 }}>Vision</h3>
              <p style={{ margin:0, fontSize:14, color:'#475569', lineHeight:1.55 }}>Consolidar una comunidad de egresados conectada, competitiva y colaborativa, referente en empleabilidad universitaria a nivel nacional.</p>
            </div>
          </div>
        </section>

        <section style={s.sectionBlock}>
          <h2 style={s.sectionTitle}>Logros</h2>
          <div style={s.logroGrid}>
            {logros.map((lg) => (
              <div key={lg.titulo} style={s.logroCard}>
                <div style={s.logroNum}>{loading ? '...' : lg.valor}</div>
                <div style={{ fontWeight:700, color:'#1e293b', marginBottom:4 }}>{lg.titulo}</div>
                <div style={{ fontSize:13, color:'#475569' }}>{lg.detalle}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={s.split}>
          <div style={s.panel}>
            <div style={s.sectionTitle}>Ofertas recientes</div>
            {!ofertas.length && <div style={{ fontSize:13, color:'#94a3b8' }}>No hay ofertas para mostrar.</div>}
            {ofertas.slice(0, 4).map((o) => (
              <div key={o.id_oferta} style={s.offerItem}>
                <div style={s.offerTitle}>{o.titulo}</div>
                <div style={s.offerMeta}>{o.empresa} · {o.modalidad} · {o.sector || 'Sin sector'}</div>
              </div>
            ))}
            <div style={{ marginTop:10 }}>
              <Link to="/bolsa" style={{ color:'#2563eb', fontSize:13, fontWeight:700, textDecoration:'none' }}>Ver todas las ofertas →</Link>
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.sectionTitle}>Recomendaciones de matching</div>
            {user.rol !== 'egresado' && <div style={{ fontSize:13, color:'#94a3b8' }}>Disponible para cuentas de egresado.</div>}
            {user.rol === 'egresado' && !recomendadas.length && <div style={{ fontSize:13, color:'#94a3b8' }}>Aun no hay recomendaciones personalizadas.</div>}
            {recomendadas.slice(0, 4).map((r) => (
              <div key={r.id_oferta} style={{ ...s.offerItem, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={s.offerTitle}>{r.titulo}</div>
                  <div style={s.offerMeta}>{r.empresa}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:800, color:'#16a34a' }}>{Math.round(r.puntaje_match || 0)}%</div>
              </div>
            ))}
          </div>
        </div>

        <section style={s.sectionBlock}>
          <h2 style={s.sectionTitle}>Preguntas frecuentes</h2>
          {faqs.map((f, idx) => (
            <div key={f.pregunta} style={s.faqItem}>
              <button style={s.faqQ} onClick={() => setFaqOpen((prev) => (prev === idx ? -1 : idx))}>
                {f.pregunta}
              </button>
              {faqOpen === idx && <div style={s.faqA}>{f.respuesta}</div>}
            </div>
          ))}
        </section>

        <h2 style={{fontSize: '1.25rem', fontWeight: '700', color: '#123057', marginBottom: '15px'}}>Servicios disponibles</h2>
        
        <div style={s.gridModules}>
          {modules.map(m => (
            m.ext 
              ? <a key={m.title} href={m.link} target="_blank" rel="noopener" style={s.moduleCard} className="module-card">
                  <span style={{fontSize: '2rem'}}>{m.icon}</span>
                  <div>
                    <h3 style={{fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '5px'}}>{m.title}</h3>
                    <p style={{fontSize: '0.86rem', color: '#64748b', lineHeight: '1.5'}}>{m.desc}</p>
                  </div>
                  <div style={{marginTop: 'auto', fontSize: '0.82rem', color: m.color, fontWeight: '700'}}>Acceder ahora →</div>
                </a>
              : <Link key={m.title} to={m.link} style={s.moduleCard} className="module-card">
                  <span style={{fontSize: '2rem'}}>{m.icon}</span>
                  <div>
                    <h3 style={{fontSize: '1rem', fontWeight: '700', color: '#1e293b', marginBottom: '5px'}}>{m.title}</h3>
                    <p style={{fontSize: '0.86rem', color: '#64748b', lineHeight: '1.5'}}>{m.desc}</p>
                  </div>
                  <div style={{marginTop: 'auto', fontSize: '0.82rem', color: m.color, fontWeight: '700'}}>Ir al modulo →</div>
                </Link>
          ))}
        </div>

        <section style={s.sectionBlock}>
          <h2 style={s.sectionTitle}>Contactanos</h2>
          <div style={s.contactGrid}>
            <div style={s.contactCard}>
              <div style={s.contactIcon}>📞</div>
              <div>
                <div style={{ fontWeight:800, color:'#0f172a' }}>Llamanos</div>
                <div style={{ fontSize:13, color:'#475569' }}>+51 970 153 565</div>
              </div>
            </div>
            <div style={s.contactCard}>
              <div style={s.contactIcon}>💬</div>
              <div>
                <div style={{ fontWeight:800, color:'#0f172a' }}>Hablemos por WhatsApp</div>
                <div style={{ fontSize:13, color:'#475569' }}>+51 970 153 565</div>
              </div>
            </div>
            <div style={s.contactCard}>
              <div style={s.contactIcon}>✉️</div>
              <div>
                <div style={{ fontWeight:800, color:'#0f172a' }}>Escribenos</div>
                <div style={{ fontSize:13, color:'#475569' }}>sge_unt@unitru.edu.pe</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer style={s.footer}>
        <div style={s.footerWrap}>
          <div style={s.footerLogo}>SGE-UNT</div>
          <div style={s.footerText}><strong>Direccion:</strong><br />Av. Juan Pablo II s/n - Ciudad Universitaria, Trujillo</div>
          <div style={{ ...s.footerText, marginTop:8 }}><strong>Contacto:</strong><br />+51 970 153 565<br />sge_unt@unitru.edu.pe</div>
          <div style={{ ...s.footerText, marginTop:8 }}><strong>Siguenos en:</strong></div>
          <div style={s.socialRow}>
            <span style={s.socialIcon}>f</span>
            <span style={s.socialIcon}>ig</span>
            <span style={s.socialIcon}>yt</span>
            <span style={s.socialIcon}>in</span>
          </div>
          <div style={s.footerLine} />
          <div style={{ fontSize:13, color:'#dbeafe' }}>Copyright © 2026 SGE-UNT</div>
        </div>
      </footer>

      <style>
        {`
          .module-card {
            position: relative;
            overflow: hidden;
          }

          .module-card::before {
            content: '';
            position: absolute;
            right: -28px;
            top: -28px;
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: linear-gradient(135deg, rgba(37,99,235,.08), rgba(16,185,129,.08));
          }

          .module-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            border-color: #3182ce;
          }
        `}
      </style>
    </div>
  );
}

