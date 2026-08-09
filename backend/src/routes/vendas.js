const router = require('express').Router();
const ctrl = require('../controllers/vendasController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.listar);
router.get('/relatorio/resumo', ctrl.relatorioResumo);
router.get('/relatorio/produtos', ctrl.relatorioPorProduto);
router.get('/relatorio/pagamentos', ctrl.relatorioPorPagamento);
router.get('/:id', ctrl.buscar);
router.post('/', ctrl.criar);
router.patch('/:id/status', ctrl.atualizarStatus);

module.exports = router;
