const router = require('express').Router();
const ctrl   = require('../controllers/mentores.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.post('/registro',      verifyToken, ctrl.registro);
router.get('/mis-solicitudes',verifyToken, ctrl.misSolicitudes);
router.get('/',               verifyToken, ctrl.getAll);
router.get('/:id',            verifyToken, ctrl.getById);

module.exports = router;
