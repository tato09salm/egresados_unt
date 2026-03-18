import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../../shared/frontend/components/Navbar/Navbar';
import Login    from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Perfil   from './pages/Perfil.jsx';
import Dashboard from './pages/Dashboard.jsx';
import RegistroEgresado from './pages/RegistroEgresado.jsx';
import PerfilEgresado from './pages/PerfilEgresado.jsx';
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx';
import AdminEgresadosCrear from './pages/admin/AdminEgresadosCrear.jsx';
import BitacoraAuditoria from './pages/admin/BitacoraAuditoria.jsx';
import api from './services/api';

// Páginas del Módulo 2 (Bolsa)
import BolsaLaboral from './modules/bolsa/BolsaLaboral.jsx';
import DetalleOferta from './modules/bolsa/DetalleOferta.jsx';
import MisPostulaciones from './modules/bolsa/MisPostulaciones.jsx';
import DashboardEmpresa from './modules/bolsa/DashboardEmpresa.jsx';
import CrearOferta from './modules/bolsa/CrearOferta.jsx';
import EstadisticasBolsa from './modules/bolsa/EstadisticasBolsa.jsx';

// Páginas del Módulo 3 (Seguimiento)
import DashboardSeguimiento from './modules/seguimiento/Dashboard.jsx';
import Encuesta from './modules/seguimiento/Encuesta.jsx';

// Páginas del Módulo 4 (Mentores)
import DirectorioMentores from './modules/mentores/DirectorioMentores.jsx';
import PerfilMentor from './modules/mentores/PerfilMentor.jsx';
import MiMentoria from './modules/mentores/MiMentoria.jsx';
import DashboardMentor from './modules/mentores/DashboardMentor.jsx';

const PrivateLayout = () => {
  const token = localStorage.getItem('sge_token');
  if (!token) return <Navigate to="/login" replace />;

  const location = useLocation();

  useEffect(() => {
    const accessId = localStorage.getItem('sge_access_id');
    if (!accessId) return;

    const path = location.pathname || '';
    let modulo = 'inicio';
    if (path.startsWith('/bolsa')) modulo = 'bolsa';
    else if (path.startsWith('/seguimiento') || path.startsWith('/encuesta')) modulo = 'seguimiento';
    else if (path.startsWith('/mentores') || path.startsWith('/mi-mentoria') || path.startsWith('/dashboard-mentor')) modulo = 'mentores';
    else if (path.startsWith('/admin')) modulo = 'registro';
    else if (path.startsWith('/perfil') || path.startsWith('/dashboard') || path.startsWith('/registro-egresado')) modulo = 'registro';

    api.post('/api/auth/track-module', { access_id: accessId, modulo }).catch(() => {});
  }, [location.pathname]);
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/registro-egresado" element={<RegistroEgresado />} />

        {/* Rutas Privadas con Navbar */}
        <Route element={<PrivateLayout />}>
          {/* Módulo 1: Registro */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil"    element={<PerfilEgresado />} />
          <Route path="/perfil-egresado" element={<PerfilEgresado />} />
          <Route path="/perfil-egresado/:id" element={<PerfilEgresado />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/admin/egresados/crear" element={<AdminEgresadosCrear />} />
          <Route path="/admin/bitacora" element={<BitacoraAuditoria />} />

          {/* Módulo 2: Bolsa Laboral */}
          <Route path="/bolsa"              element={<BolsaLaboral />} />
          <Route path="/bolsa/ofertas/:id"  element={<DetalleOferta />} />
          <Route path="/bolsa/postulaciones" element={<MisPostulaciones />} />
          <Route path="/bolsa/empresa"      element={<DashboardEmpresa />} />
          <Route path="/bolsa/empresa/oferta/nueva" element={<CrearOferta />} />
          <Route path="/bolsa/estadisticas" element={<EstadisticasBolsa />} />

          {/* Módulo 3: Seguimiento */}
          <Route path="/seguimiento"        element={<DashboardSeguimiento />} />
          <Route path="/seguimiento/encuesta/:id" element={<Encuesta />} />
          <Route path="/encuesta/:id"       element={<Encuesta />} />

          {/* Módulo 4: Mentores */}
          <Route path="/mentores"           element={<DirectorioMentores />} />
          <Route path="/mentores/:id"       element={<PerfilMentor />} />
          <Route path="/mi-mentoria"        element={<MiMentoria />} />
          <Route path="/dashboard-mentor"   element={<DashboardMentor />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
