import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');
  
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';

  const handleLogout = () => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navStyles = {
    navbar: {
      background: '#1a365d',
      color: 'white',
      height: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      fontFamily: "'Inter', sans-serif"
    },
    logo: {
      fontSize: '1.2rem',
      fontWeight: '800',
      color: '#fff',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      letterSpacing: '-0.5px',
      marginRight: '1rem'
    },
    navGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flex: 1
    },
    navLink: {
      color: 'rgba(255,255,255,0.85)',
      textDecoration: 'none',
      fontSize: '0.85rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      padding: '8px 12px',
      borderRadius: '6px',
      whiteSpace: 'nowrap'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      marginLeft: '1rem'
    },
    userBadge: {
      background: 'rgba(255,255,255,0.2)',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600'
    },
    logoutBtn: {
      background: '#e53e3e',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '0.9rem',
      fontWeight: '700',
      boxShadow: '0 4px 6px rgba(229,62,62,0.2)',
      transition: 'all 0.2s ease'
    }
  };

  return (
    <nav style={navStyles.navbar}>
      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .nav-link:hover { color: white !important; background: rgba(255,255,255,0.15); }
          .active-link { background: rgba(255,255,255,0.2) !important; color: white !important; }
        `}
      </style>

      <div style={navStyles.navGroup}>
        <Link to="/dashboard" style={navStyles.logo}>
          <span style={{fontSize: '1.5rem'}}>🎓</span> SGE-UNT
        </Link>
        
        <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active-link' : ''}`} style={navStyles.navLink}>
          Inicio
        </Link>

        <Link to="/perfil" className={`nav-link ${location.pathname === '/perfil' ? 'active-link' : ''}`} style={navStyles.navLink}>
          Registro y Perfil
        </Link>

        <Link to="/bolsa" className={`nav-link ${location.pathname === '/bolsa' ? 'active-link' : ''}`} style={navStyles.navLink}>
          Bolsa Laboral Inteligente
        </Link>

        <Link to="/seguimiento" className={`nav-link ${location.pathname === '/seguimiento' ? 'active-link' : ''}`} style={navStyles.navLink}>
          Seguimiento de Empleabilidad
        </Link>

        <Link to="/mentores" className={`nav-link ${location.pathname === '/mentores' ? 'active-link' : ''}`} style={navStyles.navLink}>
          Red de Mentores
        </Link>
      </div>

      <div style={navStyles.userInfo}>
        <div style={{textAlign: 'right', marginRight: '10px'}}>
          <div style={{fontSize: '0.85rem', fontWeight: '700'}}>{user.nombres || 'Usuario'}</div>
          <div style={{fontSize: '0.7rem', opacity: 0.8, color: '#63b3ed'}}>{user.rol?.toUpperCase() || 'EGRESADO'}</div>
        </div>
        
        {isDashboard && (
          <button 
            onClick={handleLogout}
            style={navStyles.logoutBtn}
            onMouseOver={e => e.target.style.background = '#c53030'}
            onMouseOut={e => e.target.style.background = '#e53e3e'}
          >
            Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
