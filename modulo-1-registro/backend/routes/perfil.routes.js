const router = require('express').Router();
const ctrl   = require('../controllers/perfil.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/habilidades',                    verifyToken, ctrl.getHabilidades);
router.get('/escuelas',                       verifyToken, ctrl.getEscuelas);
router.put('/:id',                            verifyToken, ctrl.updatePerfil);
router.post('/:id/habilidades',               verifyToken, ctrl.addHabilidad);
router.delete('/:id/habilidades/:id_habilidad', verifyToken, ctrl.removeHabilidad);
router.post('/:id/experiencia',               verifyToken, ctrl.addExperiencia);
router.delete('/:id/experiencia/:id_exp',     verifyToken, ctrl.removeExperiencia);
router.post('/:id/educacion',                 verifyToken, ctrl.addEducacion);
router.post('/:id/proyectos',                 verifyToken, ctrl.addProyecto);
router.delete('/:id/proyectos/:id_proy',      verifyToken, ctrl.removeProyecto);
router.get('/:id/timeline',                   verifyToken, ctrl.getTimeline);

module.exports = router;
