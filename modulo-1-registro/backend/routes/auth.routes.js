const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);
router.get('/me',        verifyToken, ctrl.me);
router.post('/logout',   verifyToken, ctrl.logout);
router.post('/track-module', verifyToken, ctrl.trackModule);

module.exports = router;
