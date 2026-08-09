const router = require('express').Router();
const ctrl = require('../controllers/produtosController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/categorias', ctrl.listarCategorias);
router.post('/categorias', ctrl.criarCategoria);
router.get('/', ctrl.listar);
router.get('/:id', ctrl.buscar);
router.post('/', ctrl.criar);
router.put('/:id', ctrl.atualizar);
router.delete('/:id', ctrl.excluir);

module.exports = router;
