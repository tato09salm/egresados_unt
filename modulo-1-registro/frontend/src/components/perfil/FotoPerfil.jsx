import React, { useState } from 'react';
import api from '../../services/api';

const s = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  preview: { width: 120, height: 120, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  initials: { fontSize: 40, fontWeight: 700, color: '#9ca3af' },
  input: { display: 'none' },
  label: { padding: '8px 16px', background: '#2d6a9f', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#e53e3e', fontSize: 12, marginTop: 4, textAlign: 'center' },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#2d6a9f' }
};

export default function FotoPerfil({ id_egresado, fotoUrl, nombres, apellidos, onUpdate }) {
  const [preview, setPreview] = useState(fotoUrl);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Usa JPG, PNG o GIF.');
      return;
    }

    // Validación de tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen debe pesar menos de 2MB.');
      return;
    }

    setError('');
    
    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Subida al servidor
    setLoading(true);
    try {
      // Convertir a base64 para el simulacro de upload
      const base64 = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(file);
      });

      await api.post(`/api/egresados/${id_egresado}/foto`, { foto_url: base64 });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError('Error al subir la imagen.');
      setPreview(fotoUrl); // Revertir preview
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return `${nombres?.[0] || ''}${apellidos?.[0] || ''}`.toUpperCase();
  };

  return (
    <div style={s.container}>
      <div style={s.preview}>
        {preview ? (
          <img src={preview} alt="Foto de perfil" style={s.img} />
        ) : (
          <div style={s.initials}>{getInitials()}</div>
        )}
        {loading && <div style={s.loading}>Subiendo...</div>}
      </div>
      <label style={s.label}>
        {loading ? 'Cargando...' : 'Cambiar Foto'}
        <input type="file" accept="image/jpeg,image/png,image/gif" style={s.input} onChange={handleFileChange} disabled={loading} />
      </label>
      {error && <div style={s.error}>{error}</div>}
    </div>
  );
}
