const router = require('express').Router();
const ctrl = require('../controllers/estoqueController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.listar);
router.get('/alerta', ctrl.estoqueBaixo);
router.get('/historico', ctrl.historico);
router.post('/movimentar', ctrl.movimentar);

module.exports = router;
