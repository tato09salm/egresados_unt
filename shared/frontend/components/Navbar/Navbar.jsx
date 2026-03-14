import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('sge_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    navigate('/login');
  };

  const isActive = (basePath) =>
    location.pathname === basePath || location.pathname.startsWith(basePath + '/');

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
    userBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.16)',
      color: '#fff',
      padding: '8px 10px',
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      lineHeight: 1
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: 'rgba(255,255,255,0.16)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: 12,
      border: '1px solid rgba(255,255,255,0.18)'
    },
    userMeta: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 2
    },
    userName: { fontSize: 12, fontWeight: 800, letterSpacing: '-0.2px' },
    userRole: { fontSize: 10, color: '#63b3ed', opacity: 0.95, fontWeight: 800, letterSpacing: '0.6px' },
    caret: {
      fontSize: 10,
      opacity: 0.9,
      transition: 'transform 0.2s ease',
      transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
      marginLeft: 2
    },
    menu: {
      position: 'absolute',
      right: 0,
      top: 'calc(100% + 10px)',
      width: 240,
      background: '#fff',
      borderRadius: 12,
      border: '1px solid rgba(0,0,0,0.08)',
      boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
      padding: 8,
      display: isDropdownOpen ? 'block' : 'none',
      animation: 'fadeInUp 0.18s ease forwards',
      zIndex: 1001
    },
    menuHeader: {
      padding: '10px 10px 12px 10px',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      marginBottom: 8
    },
    menuHeaderName: { fontWeight: 900, fontSize: 13, color: '#1a202c' },
    menuHeaderRole: { marginTop: 4, fontSize: 11, fontWeight: 800, color: '#2d6a9f' },
    menuItem: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '10px 10px',
      borderRadius: 10,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#1a202c',
      fontSize: 13,
      fontWeight: 700,
      textAlign: 'left',
      transition: 'background 0.15s ease'
    },
    menuDanger: { color: '#c53030' },
    menuHint: { fontSize: 12, color: '#a0aec0', fontWeight: 900 },
    dropdownWrap: { position: 'relative' },
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
          .user-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.22); }
          .menu-item:hover { background: rgba(26,54,93,0.06); }
        `}
      </style>

      <div style={navStyles.navGroup}>
        <Link to="/dashboard" style={navStyles.logo}>
          <span style={{fontSize: '1.5rem'}}>🎓</span> SGE-UNT
        </Link>
        
        <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active-link' : ''}`} style={navStyles.navLink}>
          Inicio
        </Link>

        <Link to="/perfil" className={`nav-link ${isActive('/perfil') ? 'active-link' : ''}`} style={navStyles.navLink}>
          Registro y Perfil
        </Link>

        <Link to="/bolsa" className={`nav-link ${isActive('/bolsa') ? 'active-link' : ''}`} style={navStyles.navLink}>
          Bolsa Laboral Inteligente
        </Link>

        <Link to="/seguimiento" className={`nav-link ${isActive('/seguimiento') ? 'active-link' : ''}`} style={navStyles.navLink}>
          Seguimiento de Empleabilidad
        </Link>

        <Link to="/mentores" className={`nav-link ${isActive('/mentores') ? 'active-link' : ''}`} style={navStyles.navLink}>
          Red de Mentores
        </Link>
      </div>

      <div style={navStyles.userInfo}>
        <div style={navStyles.dropdownWrap} ref={dropdownRef}>
          <button
            type="button"
            className="user-btn"
            style={navStyles.userBtn}
            onClick={() => setIsDropdownOpen(v => !v)}
          >
            <div style={navStyles.avatar}>
              {((user.nombres || user.username || 'U')[0] || 'U').toUpperCase()}
              {((user.apellidos || '')[0] || '').toUpperCase()}
            </div>
            <div style={navStyles.userMeta}>
              <div style={navStyles.userName}>{user.nombres || user.username || 'Usuario'}</div>
              <div style={navStyles.userRole}>{(user.rol || 'egresado').toUpperCase()}</div>
            </div>
            <span style={navStyles.caret}>▼</span>
          </button>

          <div style={navStyles.menu}>
            <div style={navStyles.menuHeader}>
              <div style={navStyles.menuHeaderName}>{user.nombres || user.username || 'Usuario'}</div>
              <div style={navStyles.menuHeaderRole}>{(user.rol || 'egresado').toUpperCase()}</div>
            </div>
            <button
              type="button"
              className="menu-item"
              style={navStyles.menuItem}
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/perfil');
              }}
            >
              <span>Configurar</span>
              <span style={navStyles.menuHint}>⚙️</span>
            </button>
            <button
              type="button"
              className="menu-item"
              style={{ ...navStyles.menuItem, ...navStyles.menuDanger }}
              onClick={() => {
                setIsDropdownOpen(false);
                handleLogout();
              }}
            >
              <span>Cerrar sesión</span>
              <span style={navStyles.menuHint}>⎋</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
