import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login          from './pages/Login.jsx';
import BolsaLaboral   from './pages/BolsaLaboral.jsx';
import DetalleOferta  from './pages/DetalleOferta.jsx';
import MisPostulaciones from './pages/MisPostulaciones.jsx';
import DashboardEmpresa from './pages/DashboardEmpresa.jsx';
import CrearOferta    from './pages/CrearOferta.jsx';

const PrivateRoute = ({ children }) => localStorage.getItem('sge_token') ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/ofertas"         element={<PrivateRoute><BolsaLaboral /></PrivateRoute>} />
        <Route path="/ofertas/:id"     element={<PrivateRoute><DetalleOferta /></PrivateRoute>} />
        <Route path="/postulaciones"   element={<PrivateRoute><MisPostulaciones /></PrivateRoute>} />
        <Route path="/empresa/dashboard" element={<PrivateRoute><DashboardEmpresa /></PrivateRoute>} />
        <Route path="/empresa/oferta/nueva" element={<PrivateRoute><CrearOferta /></PrivateRoute>} />
        <Route path="*"                element={<Navigate to="/ofertas" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
