const router = require('express').Router();
const ctrl = require('../controllers/clientesController');
const { authMiddleware } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

router.use(authMiddleware);
router.use(allowRoles('admin', 'gerente', 'operador'));
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
