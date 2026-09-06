const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/restaurantePedidosController');
const { validate } = require('../middleware/validate');

router.get('/', ctrl.listar);
router.get('/:id', [param('id').isInt({ min: 1 }).withMessage('Id do pedido inválido')], validate, ctrl.buscar);
router.post(
  '/',
  [
    body('comanda_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Comanda inválida'),
    body('itens').isArray({ min: 1 }).withMessage('Informe ao menos um item no pedido'),
    body('itens.*.produto_id').isInt({ min: 1 }).withMessage('Produto inválido'),
    body('itens.*.quantidade').isFloat({ gt: 0 }).withMessage('Quantidade deve ser maior que zero'),
    body('desconto_valor').optional().isFloat({ min: 0 }).withMessage('Desconto inválido'),
    body('taxa_servico_pct').optional().isFloat({ min: 0, max: 100 }).withMessage('Taxa de serviço inválida')
  ],
  validate,
  ctrl.criar
);
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Id do pedido inválido'),
    body('status').optional().isIn(['aberto', 'preparo', 'entregue', 'fechado', 'cancelado']).withMessage('Status inválido')
  ],
  validate,
  ctrl.atualizar
);
router.delete('/:id', [param('id').isInt({ min: 1 }).withMessage('Id do pedido inválido')], validate, ctrl.excluir);

module.exports = router;
