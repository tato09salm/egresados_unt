require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/mentores', require('./routes/mentores.routes'));
app.use('/api/mentoria', require('./routes/mentoria.routes'));
app.use('/api/sesiones', require('./routes/sesiones.routes'));
app.use('/api/mentorado',require('./routes/mentorado.routes'));

app.get('/api/health', (req, res) => res.json({ success:true, message:'Módulo 4 - Mentores: OK' }));
app.use((req, res) => res.status(404).json({ success:false, message:'Ruta no encontrada' }));
app.use(require('../../shared/middleware/errorHandler'));

const PORT = process.env.PORT || 3004;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Módulo 4 (Mentores) corriendo en puerto ${PORT}`));
