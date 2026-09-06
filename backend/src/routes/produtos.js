const router = require('express').Router();
const ctrl = require('../controllers/produtosController');
const { authMiddleware } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

router.use(authMiddleware);
router.get('/categorias', allowRoles('admin', 'gerente', 'operador'), ctrl.listarCategorias);
router.post('/categorias', allowRoles('admin', 'gerente', 'operador'), ctrl.criarCategoria);
router.get('/', (req, res, next) => {
	if (req.usuario?.perfil === 'garcom') return ctrl.listarCardapio(req, res, next);
	return ctrl.listar(req, res, next);
});
router.get('/:id', allowRoles('admin', 'gerente', 'operador'), ctrl.buscar);
router.post('/', allowRoles('admin', 'gerente', 'operador'), ctrl.criar);
router.put('/:id', allowRoles('admin', 'gerente', 'operador'), ctrl.atualizar);
router.delete('/:id', allowRoles('admin', 'gerente', 'operador'), ctrl.excluir);

module.exports = router;
