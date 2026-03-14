require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/encuestas', require('./routes/encuestas.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reportes',  require('./routes/reportes.routes'));
app.use('/api/catalogo',  require('./routes/catalogo.routes'));

app.get('/api/health', (req, res) => res.json({ success:true, message:'Módulo 3 - Seguimiento: OK' }));
app.use((req, res) => res.status(404).json({ success:false, message:'Ruta no encontrada' }));
app.use(require('../../shared/middleware/errorHandler'));

const PORT = process.env.PORT || 3003;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Módulo 3 (Seguimiento) corriendo en puerto ${PORT}`));
