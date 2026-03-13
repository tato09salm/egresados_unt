const router = require('express').Router();
const ctrl = require('../controllers/encuestas.controller');
const { verifyToken, checkRol } = require('../../../shared/middleware/auth');

router.get('/pendientes',      verifyToken, ctrl.pendientes);
router.post('/crear',          verifyToken, checkRol(['admin']), ctrl.crear);
router.get('/:id',             verifyToken, ctrl.getById);
router.post('/:id/responder',  verifyToken, ctrl.responder);
router.get('/:id/resultados',  verifyToken, ctrl.resultados);

module.exports = router;
