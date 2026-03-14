import { useState, useCallback } from 'react';
import api from '../services/api';

export function useAuth() {
  const [user, setUser]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('sge_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const login = useCallback(async (username, password) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { token, user: userData } = res.data.data;
      
      const authData = {
        ...userData,
        isAdmin: userData.rol === 'admin',
        hasEgresado: !!userData.id_egresado
      };

      localStorage.setItem('sge_token', token);
      localStorage.setItem('sge_user', JSON.stringify(authData));
      setUser(authData);
      return authData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const register = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/api/auth/register', data);
      const { token } = res.data.data;
      localStorage.setItem('sge_token', token);
      // Fetch user data
      const me = await api.get('/api/auth/me');
      const userData = me.data.data;
      
      const authData = {
        ...userData,
        isAdmin: userData.rol === 'admin',
        hasEgresado: !!userData.id_egresado
      };

      localStorage.setItem('sge_user', JSON.stringify(authData));
      setUser(authData);
      return authData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al registrarse';
      setError(msg); throw new Error(msg);
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sge_token');
    localStorage.removeItem('sge_user');
    setUser(null);
  }, []);

  return { 
    user, 
    loading, 
    error, 
    login, 
    register, 
    logout, 
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    userData: user
  };
}
