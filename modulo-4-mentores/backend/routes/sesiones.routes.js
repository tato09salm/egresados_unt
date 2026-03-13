const router = require('express').Router();
const ctrl   = require('../controllers/sesiones.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.post('/',               verifyToken, ctrl.agendar);
router.get('/',                verifyToken, ctrl.getMias);
router.put('/:id/completar',   verifyToken, ctrl.completar);
router.post('/:id/evaluar',    verifyToken, ctrl.evaluar);

module.exports = router;
