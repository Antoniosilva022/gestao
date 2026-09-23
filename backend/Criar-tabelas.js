const { Pool } = require('pg');

// Coloquei aqui a URL Externa do seu banco da Render que apareceu na sua imagem
const connectionString = 'postgresql://banco_bijuteria_user:8ZgBKAWcyRrHczyQyltq36A1kzQOwPec@dpg-daphfgvavr4c738lvc6g-a.ohio-postgres.render.com/banco_bijuteria';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false } // Obrigatório para conectar na Render
});

const sql = `
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL DEFAULT 1,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL DEFAULT 1,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    custo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unidade VARCHAR(20) DEFAULT 'un',
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    codigo VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL DEFAULT 1,
    produto_id INT NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL DEFAULT 0,
    quantidade_minima INT NOT NULL DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT NOW()
);
`;

async function rodar() {
  try {
    console.log('Conectando ao banco da Render...');
    await pool.query(sql);
    console.log('🚀 Tabelas da loja de bijuterias criadas com sucesso na Render!');
  } catch (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  } finally {
    await pool.end();
  }
}

rodar();
