const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/restauranteComandasController');
const { validate } = require('../middleware/validate');

router.get('/', ctrl.listar);
router.get('/:id', [param('id').isInt({ min: 1 }).withMessage('Id da comanda inválido')], validate, ctrl.buscar);
router.post(
  '/',
  [
    body('numero_comanda').notEmpty().withMessage('Número da comanda é obrigatório'),
    body('mesa_ref').optional().isString().trim().isLength({ max: 30 }),
    body('cliente_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Cliente inválido'),
    body('observacoes').optional().isString().trim().isLength({ max: 1000 })
  ],
  validate,
  ctrl.criar
);
router.put(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Id da comanda inválido'),
    body('status').optional().isIn(['aberta', 'fechada', 'cancelada']).withMessage('Status inválido'),
    body('cliente_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Cliente inválido')
  ],
  validate,
  ctrl.atualizar
);
router.delete('/:id', [param('id').isInt({ min: 1 }).withMessage('Id da comanda inválido')], validate, ctrl.excluir);

module.exports = router;
