const router = require('express').Router();
const ctrl   = require('../controllers/egresados.controller');
const { verifyToken, checkRol } = require('../../../shared/middleware/auth');

router.get('/buscar', verifyToken, ctrl.buscar);
router.get('/',       verifyToken, checkRol(['admin']), ctrl.getAll);
router.get('/perfil', verifyToken, ctrl.getProfile);
router.get('/:id',    verifyToken, ctrl.getById);
router.put('/:id',    verifyToken, ctrl.update);
router.post('/:id/foto', verifyToken, ctrl.updateFoto);

module.exports = router;
