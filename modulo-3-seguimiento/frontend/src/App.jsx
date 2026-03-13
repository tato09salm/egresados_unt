import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Encuesta  from './pages/Encuesta.jsx';

const PrivateRoute = ({ children }) => localStorage.getItem('sge_token') ? children : <Navigate to="/login" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/encuesta/:id"   element={<PrivateRoute><Encuesta /></PrivateRoute>} />
        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
