const router = require('express').Router();
const ctrl   = require('../controllers/empresas.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.post('/register', ctrl.register);
router.get('/',          verifyToken, ctrl.getAll);
router.get('/:id',       verifyToken, ctrl.getById);
module.exports = router;
