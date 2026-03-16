const router = require('express').Router();
const ctrl   = require('../controllers/ofertas.controller');
const post   = require('../controllers/postulaciones.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/',             verifyToken, ctrl.getAll);
router.post('/',            verifyToken, ctrl.create);
router.get('/habilidades',  verifyToken, ctrl.getHabilidades);
router.get('/:id',          verifyToken, ctrl.getById);
router.put('/:id',          verifyToken, ctrl.update);
router.delete('/:id/cerrar', verifyToken, ctrl.cerrar);
router.post('/:id/postular', verifyToken, post.postular);
module.exports = router;
