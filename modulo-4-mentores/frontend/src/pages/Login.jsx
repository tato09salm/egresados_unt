import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Login() {
  const [form, setForm]   = useState({ username:'', password:'' });
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
      navigate('/mentores');
    } catch (e) { setError(e.response?.data?.message || 'Error al iniciar sesión'); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1a365d 0%,#553c9a 100%)' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48 }}>🤝</div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'#1a365d' }}>Red de Mentores</h2>
          <p style={{ color:'#718096', fontSize:13 }}>SGE-UNT — Universidad Nacional de Trujillo</p>
        </div>
        <form onSubmit={handleSubmit}>
          {[['Usuario/Email','text','username'],['Contraseña','password','password']].map(([l,t,k]) => (
            <div key={k} style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#4a5568' }}>{l}</label>
              <input type={t} style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', marginTop:6 }}
                value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} required />
            </div>
          ))}
          {error && <div style={{ background:'#fff5f5', border:'1px solid #feb2b2', color:'#c53030', borderRadius:8, padding:'10px', fontSize:13 }}>⚠️ {error}</div>}
          <button style={{ width:'100%', padding:12, background:'#553c9a', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:16 }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
