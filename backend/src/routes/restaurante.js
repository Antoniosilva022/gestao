const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

const produtosRoutes = require('./restauranteProdutos');
const comandasRoutes = require('./restauranteComandas');
const pedidosRoutes = require('./restaurantePedidos');
const relatoriosRoutes = require('./restauranteRelatorios');

router.use(authMiddleware);
router.use('/produtos', produtosRoutes);
router.use('/comandas', comandasRoutes);
router.use('/pedidos', pedidosRoutes);
router.use('/relatorios', relatoriosRoutes);

module.exports = router;
