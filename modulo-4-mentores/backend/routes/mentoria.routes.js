const router = require('express').Router();
const ctrl   = require('../controllers/mentoria.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.post('/solicitar',        verifyToken, ctrl.solicitar);
router.put('/:id/responder',     verifyToken, ctrl.responder);
router.get('/mi-mentor',         verifyToken, ctrl.miMentor);

module.exports = router;
