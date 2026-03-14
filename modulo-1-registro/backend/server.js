require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./config/database');

const app = express();

// Probar conexión a la BD al iniciar
db.query('SELECT NOW()')
  .then(() => console.log('✅ BD conectada: ' + process.env.DB_NAME))
  .catch(err => console.error('❌ Error conexión BD:', err.message));

// Middlewares globales
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/egresados', require('./routes/egresados.routes'));
app.use('/api/perfil',    require('./routes/perfil.routes'));
app.use('/api/admin',     require('./routes/admin.routes'));
app.use('/api/usuarios',  require('./routes/usuarios.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Módulo 1 - Registro y Perfil: OK', port: process.env.PORT });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// Manejo global de errores
app.use(require('../../shared/middleware/errorHandler'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Módulo 1 (Registro) corriendo en puerto ${PORT}`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}`);
});
