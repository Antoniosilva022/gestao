const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');

const comandasRoutes = require('./restauranteComandas');
const pedidosRoutes = require('./restaurantePedidos');

router.use(authMiddleware);
router.use('/comandas', comandasRoutes);
router.use('/pedidos', pedidosRoutes);

module.exports = router;
