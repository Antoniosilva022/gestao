require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');
const { pool } = require('../config/database');

async function ensureDatabaseExists() {
  const databaseName = process.env.DB_NAME;

  if (!databaseName) {
    throw new Error('DB_NAME não definido no arquivo .env');
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();

  try {
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [databaseName]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
      console.log(`Banco de dados "${databaseName}" criado com sucesso`);
    }
  } finally {
    await client.end();
  }
}

const migrations = `
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  slug VARCHAR(120) UNIQUE,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

INSERT INTO empresas (id, nome, slug, ativo)
VALUES (1, 'Empresa Demo', 'empresa-demo', true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) DEFAULT 'operador' CHECK (perfil IN ('admin', 'gerente', 'operador')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo NUMERIC(10,2) DEFAULT 0,
  unidade VARCHAR(20) DEFAULT 'UN',
  categoria_id INTEGER REFERENCES categorias(id),
  codigo VARCHAR(50) UNIQUE,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER UNIQUE REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade NUMERIC(10,3) DEFAULT 0,
  quantidade_minima NUMERIC(10,3) DEFAULT 0,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id SERIAL PRIMARY KEY,
  produto_id INTEGER REFERENCES produtos(id),
  tipo VARCHAR(10) CHECK (tipo IN ('entrada', 'saida')),
  quantidade NUMERIC(10,3) NOT NULL,
  motivo VARCHAR(100),
  usuario_id INTEGER REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  subtotal NUMERIC(10,2) DEFAULT 0,
  desconto NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  forma_pagamento VARCHAR(30),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id SERIAL PRIMARY KEY,
  venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  quantidade NUMERIC(10,3) NOT NULL,
  preco_unitario NUMERIC(10,2) NOT NULL,
  desconto NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  cpf VARCHAR(14),
  telefone VARCHAR(20),
  cargo VARCHAR(100),
  departamento VARCHAR(100),
  salario NUMERIC(10,2),
  data_admissao DATE,
  data_demissao DATE,
  status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado')),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(10) CHECK (tipo IN ('pagar', 'receber')),
  descricao VARCHAR(200) NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  pagamento DATE,
  status VARCHAR(15) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'vencido')),
  categoria VARCHAR(100),
  cliente_id INTEGER REFERENCES clientes(id),
  funcionario_id INTEGER REFERENCES funcionarios(id),
  venda_id INTEGER REFERENCES vendas(id),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comandas (
  id SERIAL PRIMARY KEY,
  numero_comanda VARCHAR(30) NOT NULL UNIQUE,
  mesa_ref VARCHAR(30),
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_abertura_id INTEGER REFERENCES usuarios(id),
  status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  fechado_em TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  comanda_id INTEGER REFERENCES comandas(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  mesa_ref VARCHAR(30),
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto', 'preparo', 'entregue', 'fechado', 'cancelado')),
  desconto_valor NUMERIC(10,2) DEFAULT 0,
  taxa_servico_pct NUMERIC(5,2) DEFAULT 10,
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  quantidade NUMERIC(10,3) NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
  observacao TEXT,
  status_item VARCHAR(20) DEFAULT 'solicitado' CHECK (status_item IN ('solicitado', 'preparo', 'pronto', 'entregue', 'cancelado')),
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

CREATE TABLE IF NOT EXISTS pagamentos_pedido (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR(25) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'voucher')),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  status VARCHAR(20) DEFAULT 'confirmado' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  pago_em TIMESTAMP DEFAULT NOW()
);

-- Pilar 1: multiempresa (tenant)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE categorias ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE estoque ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE vendas ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE contas ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS empresa_id INTEGER;
ALTER TABLE pagamentos_pedido ADD COLUMN IF NOT EXISTS empresa_id INTEGER;

UPDATE usuarios SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE clientes SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE categorias SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE produtos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE estoque SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE movimentacoes_estoque SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE vendas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE itens_venda SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE funcionarios SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE contas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE comandas SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE pedidos SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE itens_pedido SET empresa_id = 1 WHERE empresa_id IS NULL;
UPDATE pagamentos_pedido SET empresa_id = 1 WHERE empresa_id IS NULL;

ALTER TABLE usuarios ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE clientes ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE categorias ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE produtos ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE estoque ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE movimentacoes_estoque ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE vendas ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE itens_venda ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE funcionarios ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE contas ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE comandas ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE pedidos ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE itens_pedido ALTER COLUMN empresa_id SET DEFAULT 1;
ALTER TABLE pagamentos_pedido ALTER COLUMN empresa_id SET DEFAULT 1;

ALTER TABLE usuarios ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE clientes ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE categorias ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE produtos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE estoque ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE movimentacoes_estoque ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE vendas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE itens_venda ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE funcionarios ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE contas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE comandas ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE pedidos ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE itens_pedido ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE pagamentos_pedido ALTER COLUMN empresa_id SET NOT NULL;

DO $$
BEGIN
  INSERT INTO categorias (empresa_id, nome, descricao)
  SELECT 1, cat.nome, cat.descricao
  FROM (
    VALUES
      ('Entradas', 'Porções leves e itens de abertura do cardápio'),
      ('Saladas', 'Saladas frias e pratos leves'),
      ('Pratos Principais', 'Pratos executivos e pratos completos'),
      ('Massas', 'Massas, lasanhas e nhoques'),
      ('Pizzas', 'Pizzas individuais ou grandes'),
      ('Lanches', 'Sanduíches, salgados e lanches rápidos'),
      ('Hambúrgueres', 'Hambúrgueres artesanais ou tradicionais'),
      ('Porções', 'Porções para compartilhar'),
      ('Sobremesas', 'Doces e sobremesas em geral'),
      ('Sorvetes', 'Sorvetes, gelatos e taças'),
      ('Bebidas', 'Bebidas em geral'),
      ('Refrigerantes', 'Refrigerantes e bebidas gaseificadas'),
      ('Sucos', 'Sucos naturais e industrializados'),
      ('Águas', 'Águas com e sem gás'),
      ('Cafés', 'Cafés, expressos e especiais'),
      ('Chás', 'Chás quentes ou gelados'),
      ('Cervejas', 'Cervejas nacionais e artesanais'),
      ('Vinhos', 'Vinhos e espumantes'),
      ('Drinks', 'Coquetéis e drinks alcoólicos'),
      ('Molhos e Complementos', 'Molhos, adicionais e acompanhamentos'),
      ('Carnes', 'Carnes bovinas, suínas e nobres'),
      ('Frangos', 'Preparos com frango'),
      ('Peixes e Frutos do Mar', 'Peixes, camarões e frutos do mar'),
      ('Acompanhamentos', 'Arroz, batata, farofa e similares'),
      ('Padaria e Café da Manhã', 'Pães, frios e itens de café da manhã'),
      ('Ingredientes', 'Itens de estoque e insumos de cozinha'),
      ('Embalagens', 'Potes, sacolas e itens para delivery'),
      ('Limpeza e Higiene', 'Itens de limpeza e uso operacional')
  ) AS cat(nome, descricao)
  WHERE NOT EXISTS (
    SELECT 1 FROM categorias c
    WHERE c.empresa_id = 1 AND c.nome = cat.nome
  );
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_empresa_id_fkey') THEN
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clientes_empresa_id_fkey') THEN
    ALTER TABLE clientes ADD CONSTRAINT clientes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categorias_empresa_id_fkey') THEN
    ALTER TABLE categorias ADD CONSTRAINT categorias_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_empresa_id_fkey') THEN
    ALTER TABLE produtos ADD CONSTRAINT produtos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'estoque_empresa_id_fkey') THEN
    ALTER TABLE estoque ADD CONSTRAINT estoque_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimentacoes_estoque_empresa_id_fkey') THEN
    ALTER TABLE movimentacoes_estoque ADD CONSTRAINT movimentacoes_estoque_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendas_empresa_id_fkey') THEN
    ALTER TABLE vendas ADD CONSTRAINT vendas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'itens_venda_empresa_id_fkey') THEN
    ALTER TABLE itens_venda ADD CONSTRAINT itens_venda_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funcionarios_empresa_id_fkey') THEN
    ALTER TABLE funcionarios ADD CONSTRAINT funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contas_empresa_id_fkey') THEN
    ALTER TABLE contas ADD CONSTRAINT contas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comandas_empresa_id_fkey') THEN
    ALTER TABLE comandas ADD CONSTRAINT comandas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_empresa_id_fkey') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'itens_pedido_empresa_id_fkey') THEN
    ALTER TABLE itens_pedido ADD CONSTRAINT itens_pedido_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagamentos_pedido_empresa_id_fkey') THEN
    ALTER TABLE pagamentos_pedido ADD CONSTRAINT pagamentos_pedido_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES empresas(id);
  END IF;
END $$;

-- Pilar 2: unicidade por empresa
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS produtos_codigo_key;
ALTER TABLE comandas DROP CONSTRAINT IF EXISTS comandas_numero_comanda_key;

CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_empresa_email ON usuarios (empresa_id, email);
CREATE UNIQUE INDEX IF NOT EXISTS ux_produtos_empresa_codigo ON produtos (empresa_id, codigo) WHERE codigo IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_comandas_empresa_numero ON comandas (empresa_id, numero_comanda);

-- Pilar 3: índices de performance
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes (empresa_id);
CREATE INDEX IF NOT EXISTS idx_produtos_empresa_id ON produtos (empresa_id);
CREATE INDEX IF NOT EXISTS idx_vendas_empresa_data ON vendas (empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa_data ON pedidos (empresa_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_contas_empresa_status_vencimento ON contas (empresa_id, status, vencimento);

-- Pilar 4: trilha de auditoria base
CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id BIGSERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(80),
  acao VARCHAR(30) NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_data ON auditoria_eventos (empresa_id, criado_em DESC);

-- Seed: usuário admin padrão (senha: admin123)
INSERT INTO usuarios (empresa_id, nome, email, senha, perfil)
VALUES (1, 'Administrador', 'admin@empresa.com', '$2a$10$MYhWkSU/7E8KWjP88MkuuO5rGC2L.Y0CnO1t9EbVHxGANrejU4UpC', 'admin')
ON CONFLICT DO NOTHING;
`;

async function migrate() {
  try {
    await ensureDatabaseExists();
    await pool.query(migrations);
    console.log('Migrações executadas com sucesso!');
  } catch (err) {
    console.error('Erro ao executar migrações:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
