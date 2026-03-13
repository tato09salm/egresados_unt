const router = require('express').Router();
const ctrl   = require('../controllers/postulaciones.controller');
const { verifyToken } = require('../../../shared/middleware/auth');
router.get('/recomendaciones', verifyToken, ctrl.recomendaciones);
module.exports = router;
