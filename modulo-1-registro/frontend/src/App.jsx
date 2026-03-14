import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from '../../../shared/frontend/components/Navbar/Navbar';
import Login    from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Perfil   from './pages/Perfil.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Páginas del Módulo 2 (Bolsa)
import BolsaLaboral from './modules/bolsa/BolsaLaboral.jsx';
import DetalleOferta from './modules/bolsa/DetalleOferta.jsx';
import MisPostulaciones from './modules/bolsa/MisPostulaciones.jsx';
import DashboardEmpresa from './modules/bolsa/DashboardEmpresa.jsx';
import CrearOferta from './modules/bolsa/CrearOferta.jsx';

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

        {/* Rutas Privadas con Navbar */}
        <Route element={<PrivateLayout />}>
          {/* Módulo 1: Registro */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/perfil"    element={<Perfil />} />

          {/* Módulo 2: Bolsa Laboral */}
          <Route path="/bolsa"              element={<BolsaLaboral />} />
          <Route path="/bolsa/ofertas/:id"  element={<DetalleOferta />} />
          <Route path="/bolsa/postulaciones" element={<MisPostulaciones />} />
          <Route path="/bolsa/empresa"      element={<DashboardEmpresa />} />
          <Route path="/bolsa/empresa/oferta/nueva" element={<CrearOferta />} />

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
