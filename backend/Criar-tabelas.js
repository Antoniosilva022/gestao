const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
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
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL DEFAULT 1,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT NOW()
);
`;

async function rodar() {
  try {
    console.log('Conectando ao banco configurado...');
    await pool.query(sql);
    console.log('Tabelas da loja de bijuterias criadas com sucesso!');
  } catch (err) {
    console.error('Erro ao criar tabelas:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

rodar();
