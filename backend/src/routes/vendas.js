const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/vendasController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authMiddleware);
router.get('/', ctrl.listar);
router.get('/relatorio/resumo', ctrl.relatorioResumo);
router.get('/relatorio/produtos', ctrl.relatorioPorProduto);
router.get('/relatorio/pagamentos', ctrl.relatorioPorPagamento);
router.get('/:id', [param('id').isInt({ min: 1 }).withMessage('Id da venda inválido')], validate, ctrl.buscar);
router.post(
	'/',
	[
		body('cliente_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Cliente inválido'),
		body('itens').isArray({ min: 1 }).withMessage('Adicione pelo menos um item para registrar a venda'),
		body('itens.*.produto_id').isInt({ min: 1 }).withMessage('Produto inválido'),
		body('itens.*.quantidade').isFloat({ gt: 0 }).withMessage('Quantidade deve ser maior que zero'),
		body('itens.*.desconto').optional().isFloat({ min: 0 }).withMessage('Desconto do item inválido'),
		body('desconto').optional().isFloat({ min: 0 }).withMessage('Desconto inválido'),
		body('forma_pagamento').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Forma de pagamento inválida'),
		body('observacoes').optional().isString().trim().isLength({ max: 1000 }).withMessage('Observações muito longas')
	],
	validate,
	ctrl.criar
);
router.patch(
	'/:id/status',
	[
		param('id').isInt({ min: 1 }).withMessage('Id da venda inválido'),
		body('status').isIn(['aberta', 'fechada', 'cancelada']).withMessage('Status inválido')
	],
	validate,
	ctrl.atualizarStatus
);

module.exports = router;
