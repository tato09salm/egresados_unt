const router = require('express').Router();
const ctrl   = require('../controllers/postulaciones.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/mis-postulaciones',   verifyToken, ctrl.misPostulaciones);
router.get('/oferta/:id',          verifyToken, ctrl.postulantesOferta);
router.put('/:id/estado',          verifyToken, ctrl.cambiarEstado);
module.exports = router;
