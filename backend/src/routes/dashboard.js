const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');
const { allowRoles } = require('../middleware/roles');

router.get('/', authMiddleware, allowRoles('admin', 'gerente', 'operador'), ctrl.obterDados);

module.exports = router;
