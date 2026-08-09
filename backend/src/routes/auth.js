const router = require('express').Router();
const ctrl = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.me);
router.put('/senha', authMiddleware, ctrl.alterarSenha);
router.get('/usuarios', authMiddleware, adminMiddleware, ctrl.listarUsuarios);
router.post('/usuarios', authMiddleware, adminMiddleware, ctrl.criarUsuario);

module.exports = router;
