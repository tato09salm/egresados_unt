const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { verifyToken } = require('../../../shared/middleware/auth');
const isAdminMiddleware = require('../middleware/admin');

// Aplicar verificación de token y de rol admin a todas las rutas de este archivo
router.use(verifyToken);
router.use(isAdminMiddleware);

router.get('/usuarios', ctrl.getUsuarios);
router.get('/usuarios/sin-egresado', ctrl.getUsuariosSinEgresado);
router.get('/bitacora', ctrl.getBitacoraAccesos);
router.post('/egresados', ctrl.crearEgresado);
router.delete('/egresados/:id', ctrl.eliminarEgresado);

module.exports = router;
