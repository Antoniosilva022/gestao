const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

const comandasRoutes = require('./restauranteComandas');
const pedidosRoutes = require('./restaurantePedidos');

router.use(authMiddleware);
router.use(allowRoles('admin', 'gerente', 'operador', 'garcom'));
router.use('/comandas', comandasRoutes);
router.use('/pedidos', pedidosRoutes);

module.exports = router;
