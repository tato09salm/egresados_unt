import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login              from './pages/Login.jsx';
import DirectorioMentores from './pages/DirectorioMentores.jsx';
import PerfilMentor       from './pages/PerfilMentor.jsx';
import MiMentoria         from './pages/MiMentoria.jsx';
import DashboardMentor    from './pages/DashboardMentor.jsx';

const PrivateRoute = ({ children }) => localStorage.getItem('sge_token') ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"              element={<Login />} />
        <Route path="/mentores"           element={<PrivateRoute><DirectorioMentores /></PrivateRoute>} />
        <Route path="/mentores/:id"       element={<PrivateRoute><PerfilMentor /></PrivateRoute>} />
        <Route path="/mi-mentoria"        element={<PrivateRoute><MiMentoria /></PrivateRoute>} />
        <Route path="/dashboard-mentor"   element={<PrivateRoute><DashboardMentor /></PrivateRoute>} />
        <Route path="*"                   element={<Navigate to="/mentores" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
