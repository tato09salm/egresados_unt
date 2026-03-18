const router = require('express').Router();
const ctrl   = require('../controllers/perfil.controller');
const { verifyToken } = require('../../../shared/middleware/auth');

router.get('/habilidades',                    verifyToken, ctrl.getHabilidades);
// Público: requerido para el flujo de registro (pantalla /register)
router.get('/escuelas',                       ctrl.getEscuelas);
router.put('/:id',                            verifyToken, ctrl.updatePerfil);
router.post('/:id/habilidades',               verifyToken, ctrl.addHabilidad);
router.delete('/:id/habilidades/:id_habilidad', verifyToken, ctrl.removeHabilidad);
router.post('/:id/experiencia',               verifyToken, ctrl.addExperiencia);
router.put('/:id/experiencia/:id_exp',        verifyToken, ctrl.updateExperiencia);
router.delete('/:id/experiencia/:id_exp',     verifyToken, ctrl.removeExperiencia);
router.post('/:id/educacion',                 verifyToken, ctrl.addEducacion);
router.put('/:id/educacion/:id_edu',           verifyToken, ctrl.updateEducacion);
router.delete('/:id/educacion/:id_edu',       verifyToken, ctrl.removeEducacion);
router.post('/:id/proyectos',                 verifyToken, ctrl.addProyecto);
router.delete('/:id/proyectos/:id_proy',      verifyToken, ctrl.removeProyecto);
router.get('/:id/timeline',                   verifyToken, ctrl.getTimeline);

module.exports = router;
