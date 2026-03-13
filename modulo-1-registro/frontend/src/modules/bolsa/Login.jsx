import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api_bolsa';

const s = {
  page: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a365d 0%,#276749 100%)' },
  card: { background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' },
  input: { width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', marginTop:6 },
  btn: { width:'100%', padding:12, background:'#276749', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:24 },
  err: { background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px 14px', marginTop:12, fontSize:13 },
  label: { display:'block', fontSize:13, fontWeight:600, color:'#4a5568', marginTop:16 },
};

export default function Login() {
  const [form, setForm] = useState({ username:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/api/auth/login', form);
      const { token, user } = res.data.data;
      localStorage.setItem('sge_token', token);
      localStorage.setItem('sge_user', JSON.stringify(user));
      navigate(user.rol === 'empresa' ? '/bolsa/empresa' : '/bolsa');
    } catch (e) {
      setError(e.response?.data?.message || 'Credenciales inválidas');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48 }}>💼</div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'#1a365d' }}>Bolsa Laboral</h2>
          <p style={{ color:'#718096', fontSize:13 }}>SGE-UNT — Universidad Nacional de Trujillo</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Usuario / Email</label>
          <input style={s.input} value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required />
          <label style={s.label}>Contraseña</label>
          <input style={s.input} type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required />
          {error && <div style={s.err}>⚠️ {error}</div>}
          <button style={s.btn} disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
        <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:'#a0aec0' }}>
          Egresado: usa tus credenciales del módulo 1<br/>
          Empresa: rrhh@techsol.com / Empresa2024!
        </p>
      </div>
    </div>
  );
}
