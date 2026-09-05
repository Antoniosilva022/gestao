const app = require('./app');
const { testConnection } = require('./config/database');

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  await testConnection();
  console.log(`Servidor rodando na porta ${PORT}`);
});
