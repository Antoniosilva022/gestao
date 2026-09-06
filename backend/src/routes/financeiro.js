const router = require('express').Router();
const ctrl = require('../controllers/financeiroController');
const { authMiddleware } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

router.use(authMiddleware);
router.use(allowRoles('admin', 'gerente', 'operador'));
router.get('/resumo', ctrl.resumo);
router.get('/', ctrl.listar);
router.post('/', ctrl.criar);
router.patch('/:id/pagar', ctrl.pagar);
router.patch('/:id/cancelar', ctrl.cancelar);

module.exports = router;
