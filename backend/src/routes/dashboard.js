const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, ctrl.obterDados);

module.exports = router;
