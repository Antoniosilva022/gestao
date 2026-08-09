const router = require('express').Router();
const ctrl = require('../controllers/restauranteRelatoriosController');

router.get('/faturamento-diario', ctrl.faturamentoDiario);
router.get('/produtos-mais-vendidos', ctrl.produtosMaisVendidos);
router.get('/ticket-medio', ctrl.ticketMedio);

module.exports = router;
