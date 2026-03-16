const router = require('express').Router();
const ctrl   = require('../controllers/mentores.controller');
const { verifyToken } = require('../../../shared/middleware/auth');
let upload;
try {
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');
  const uploadDir = path.join(__dirname, '../uploads/mentores');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g,'_')}`)
  });
  upload = multer({ storage, limits: { fileSize: 5*1024*1024 }, fileFilter: (req,file,cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo imágenes permitidas'));
  }});
} catch(e) { upload = { single: () => (req,res,next) => next() }; }

router.post('/registro',       verifyToken, upload.single('foto'), ctrl.registro);
router.put('/perfil',          verifyToken, upload.single('foto'), ctrl.editarPerfil);
router.get('/me',              verifyToken, ctrl.getMe);
router.get('/mis-solicitudes', verifyToken, ctrl.misSolicitudes);
router.get('/',                verifyToken, ctrl.getAll);
router.get('/:id',             verifyToken, ctrl.getById);

module.exports = router;
