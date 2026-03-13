const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/facultad/:id', verifyToken, ctrl.porFacultad);
router.get('/escuela/:id',  verifyToken, ctrl.porEscuela);
router.get('/tendencias',   verifyToken, ctrl.tendencias);

module.exports = router;
