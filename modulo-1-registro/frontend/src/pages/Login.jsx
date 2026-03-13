import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const styles = {
  container: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a365d 0%,#2d6a9f 100%)' },
  card: { background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' },
  logo: { textAlign:'center', marginBottom:32 },
  h1: { fontSize:28, fontWeight:700, color:'#1a365d', marginBottom:4 },
  sub: { color:'#718096', fontSize:14 },
  label: { display:'block', fontSize:13, fontWeight:600, color:'#4a5568', marginBottom:6, marginTop:16 },
  input: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', transition:'border-color .2s' },
  passwordContainer: { position: 'relative', width: '100%' },
  eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' },
  btn: { width:'100%', padding:'12px', background:'#2d6a9f', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:24 },
  error: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px 14px', marginTop:16, fontSize:13 },
  link: { textAlign:'center', marginTop:20, fontSize:13, color:'#718096' },
  a: { color:'#2d6a9f', fontWeight:600, textDecoration:'none' },
};

export default function Login() {
  const [form, setForm] = useState({ username:'', password:'' });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch {}
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={{ fontSize:48, marginBottom:8 }}>🎓</div>
          <h1 style={styles.h1}>SGE-UNT</h1>
          <p style={styles.sub}>Sistema de Gestión de Egresados<br/>Universidad Nacional de Trujillo</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Usuario o Email</label>
          <input style={styles.input} value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="usuario o email" required />
          <label style={styles.label}>Contraseña</label>
          <div style={styles.passwordContainer}>
            <input 
              style={{...styles.input, paddingRight: '45px'}} 
              type={showPassword ? "text" : "password"} 
              value={form.password} 
              onChange={e => setForm({...form, password:e.target.value})} 
              placeholder="••••••••" 
              required 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
              title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <span style={{fontSize: '18px'}}>👁️‍🗨️</span>
              ) : (
                <span style={{fontSize: '18px'}}>👁️</span>
              )}
            </button>
          </div>
          {error && <div style={styles.error}>⚠️ {error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div style={styles.link}>
          ¿No tienes cuenta? <Link to="/register" style={styles.a}>Regístrate aquí</Link>
        </div>
        <div style={{...styles.link, marginTop:8, fontSize:11, color:'#a0aec0'}}>
          Admin: admin / Admin2024! | Empresa: rrhh@techsol.com / Empresa2024!
        </div>
      </div>
    </div>
  );
}
