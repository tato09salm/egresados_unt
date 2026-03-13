const router = require('express').Router();
const ctrl   = require('../controllers/mentoria.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/mi-mentor', verifyToken, ctrl.miMentor);

module.exports = router;
