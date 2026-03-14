const router = require('express').Router();
const ctrl = require('../controllers/encuestas.controller');
const { verifyToken, checkRol } = require('../../../shared/middleware/auth');

router.get('/pendientes',      verifyToken, ctrl.pendientes);
router.get('/',               verifyToken, checkRol(['admin']), ctrl.listar);
router.post('/',              verifyToken, checkRol(['admin']), ctrl.crear);
router.post('/crear',          verifyToken, checkRol(['admin']), ctrl.crear);
router.get('/:id',             verifyToken, ctrl.getById);
router.put('/:id',             verifyToken, checkRol(['admin']), ctrl.actualizarEncuesta);
router.patch('/:id/activa',     verifyToken, checkRol(['admin']), ctrl.toggleEncuesta);
router.delete('/:id',           verifyToken, checkRol(['admin']), ctrl.eliminarEncuesta);
router.get('/:id/preguntas',   verifyToken, checkRol(['admin']), ctrl.getPreguntasAdmin);
router.post('/:id/preguntas',  verifyToken, checkRol(['admin']), ctrl.crearPregunta);
router.post('/:id/responder',  verifyToken, ctrl.responder);
router.get('/:id/resultados',  verifyToken, ctrl.resultados);
router.put('/preguntas/:id_pregunta', verifyToken, checkRol(['admin']), ctrl.actualizarPregunta);
router.patch('/preguntas/:id_pregunta/habilitada', verifyToken, checkRol(['admin']), ctrl.togglePregunta);
router.delete('/preguntas/:id_pregunta', verifyToken, checkRol(['admin']), ctrl.eliminarPregunta);

module.exports = router;
