import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  
  const stats = [
    { label: 'Módulos Activos', value: '4', icon: '🚀', color: '#3182ce' },
    { label: 'Ofertas Laborales', value: '124', icon: '💼', color: '#38a169' },
    { label: 'Mentores Disponibles', value: '12', icon: '🤝', color: '#805ad5' },
    { label: 'Encuestas Pendientes', value: '1', icon: '📊', color: '#dd6b20' },
  ];

  const s = {
    container: { minHeight: '100vh', background: '#f7fafc' },
    hero: { 
      background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)', 
      color: 'white', 
      padding: '60px 20px', 
      textAlign: 'center',
      marginBottom: '40px'
    },
    welcome: { fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' },
    sub: { fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' },
    content: { maxWidth: '1100px', margin: '0 auto', padding: '0 20px' },
    gridStats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' },
    gridModules: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px', marginBottom: '60px' },
    moduleCard: { 
      background: '#fff', 
      borderRadius: '16px', 
      padding: '30px', 
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
      textDecoration: 'none', 
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      border: '1px solid #edf2f7'
    }
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
        <h1 style={s.welcome}>Bienvenido, {user.nombres?.split(' ')[0] || 'Egresado'}</h1>
        <p style={s.sub}>Gestione su carrera profesional y manténgase conectado con su alma mater desde el portal oficial UNT.</p>
      </div>

      <div style={s.content}>
        <div style={s.gridStats}>
          {stats.map(st => (
            <div key={st.label} style={s.statCard}>
              <span style={{fontSize: '2rem'}}>{st.icon}</span>
              <div>
                <div style={{fontSize: '1.2rem', fontWeight: '800', color: '#2d3748'}}>{st.value}</div>
                <div style={{fontSize: '0.75rem', color: '#718096', fontWeight: '600'}}>{st.label}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#1a365d', marginBottom: '25px'}}>Servicios Disponibles</h2>
        
        <div style={s.gridModules}>
          {modules.map(m => (
            m.ext 
              ? <a key={m.title} href={m.link} target="_blank" rel="noopener" style={s.moduleCard} className="module-card">
                  <span style={{fontSize: '2.5rem'}}>{m.icon}</span>
                  <div>
                    <h3 style={{fontSize: '1.1rem', fontWeight: '700', color: '#2d3748', marginBottom: '5px'}}>{m.title}</h3>
                    <p style={{fontSize: '0.9rem', color: '#718096', lineHeight: '1.5'}}>{m.desc}</p>
                  </div>
                  <div style={{marginTop: 'auto', fontSize: '0.85rem', color: m.color, fontWeight: '700'}}>Acceder ahora →</div>
                </a>
              : <Link key={m.title} to={m.link} style={s.moduleCard} className="module-card">
                  <span style={{fontSize: '2.5rem'}}>{m.icon}</span>
                  <div>
                    <h3 style={{fontSize: '1.1rem', fontWeight: '700', color: '#2d3748', marginBottom: '5px'}}>{m.title}</h3>
                    <p style={{fontSize: '0.9rem', color: '#718096', lineHeight: '1.5'}}>{m.desc}</p>
                  </div>
                  <div style={{marginTop: 'auto', fontSize: '0.85rem', color: m.color, fontWeight: '700'}}>Ver mi perfil →</div>
                </Link>
          ))}
        </div>
      </div>

      <style>
        {`
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

