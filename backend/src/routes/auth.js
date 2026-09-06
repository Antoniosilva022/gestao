const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post(
  '/login',
  [body('email').isEmail().withMessage('Email inválido'), body('senha').notEmpty().withMessage('Senha é obrigatória')],
  validate,
  ctrl.login
);
router.get('/me', authMiddleware, ctrl.me);
router.put(
  '/senha',
  authMiddleware,
  [
    body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
    body('novaSenha').isLength({ min: 6 }).withMessage('Nova senha deve ter ao menos 6 caracteres')
  ],
  validate,
  ctrl.alterarSenha
);
router.get('/usuarios', authMiddleware, adminMiddleware, ctrl.listarUsuarios);
router.post(
  '/usuarios',
  authMiddleware,
  adminMiddleware,
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email inválido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter ao menos 6 caracteres'),
    body('perfil').optional().isIn(['admin', 'gerente', 'operador', 'garcom']).withMessage('Perfil inválido')
  ],
  validate,
  ctrl.criarUsuario
);

module.exports = router;
