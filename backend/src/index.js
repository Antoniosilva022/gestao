require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const produtosRoutes = require('./routes/produtos');
const vendasRoutes = require('./routes/vendas');
const estoqueRoutes = require('./routes/estoque');
const financeiroRoutes = require('./routes/financeiro');
const funcionariosRoutes = require('./routes/funcionarios');
const dashboardRoutes = require('./routes/dashboard');
const restauranteRoutes = require('./routes/restaurante');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/funcionarios', funcionariosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/restaurante', restauranteRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, async () => {
  await testConnection();
  console.log(`Servidor rodando na porta ${PORT}`);
});
