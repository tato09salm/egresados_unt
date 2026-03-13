require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/empresas',      require('./routes/empresas.routes'));
app.use('/api/ofertas',       require('./routes/ofertas.routes'));
app.use('/api/postulaciones', require('./routes/postulaciones.routes'));
app.use('/api/match',         require('./routes/match.routes'));

app.get('/api/health', (req, res) => res.json({ success:true, message:'Módulo 2 - Bolsa Laboral: OK', port: process.env.PORT }));
app.use((req, res) => res.status(404).json({ success:false, message:`Ruta no encontrada: ${req.method} ${req.path}` }));
app.use(require('../../shared/middleware/errorHandler'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Módulo 2 (Bolsa Laboral) corriendo en puerto ${PORT}`));
