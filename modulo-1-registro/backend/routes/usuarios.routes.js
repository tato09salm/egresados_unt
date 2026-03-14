const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.put('/:id/cambiar-password', verifyToken, ctrl.changePassword);

module.exports = router;
