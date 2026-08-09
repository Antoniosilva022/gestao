BEGIN;

-- Schema para restaurante de praia (Nordeste)
-- Banco: PostgreSQL

CREATE TABLE IF NOT EXISTS unidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado CHAR(2) NOT NULL,
  bairro VARCHAR(100),
  endereco TEXT,
  telefone VARCHAR(20),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS setores (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nome VARCHAR(80) NOT NULL,
  descricao TEXT,
  UNIQUE (unidade_id, nome)
);

CREATE TABLE IF NOT EXISTS mesas (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  setor_id INTEGER REFERENCES setores(id) ON DELETE SET NULL,
  codigo VARCHAR(20) NOT NULL,
  capacidade INTEGER NOT NULL CHECK (capacidade > 0),
  tipo VARCHAR(20) NOT NULL DEFAULT 'mesa' CHECK (tipo IN ('mesa', 'quiosque', 'barraca', 'balcao')),
  status VARCHAR(20) NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'reservada', 'manutencao')),
  ativo BOOLEAN DEFAULT TRUE,
  UNIQUE (unidade_id, codigo)
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(150),
  cpf VARCHAR(14),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cargos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) UNIQUE NOT NULL,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS funcionarios (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  cargo_id INTEGER REFERENCES cargos(id),
  nome VARCHAR(150) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(150),
  data_admissao DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias')),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias_produto (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  descricao TEXT
);

CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  categoria_id INTEGER REFERENCES categorias_produto(id),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  custo NUMERIC(10,2) DEFAULT 0 CHECK (custo >= 0),
  unidade_medida VARCHAR(15) NOT NULL DEFAULT 'UN',
  tempo_preparo_min INTEGER DEFAULT 0 CHECK (tempo_preparo_min >= 0),
  disponivel BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (nome)
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  contato VARCHAR(120),
  telefone VARCHAR(20),
  cidade VARCHAR(100),
  estado CHAR(2),
  tipo VARCHAR(30) DEFAULT 'geral' CHECK (tipo IN ('pescador', 'hortifruti', 'bebidas', 'geral')),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_atual NUMERIC(12,3) NOT NULL DEFAULT 0,
  quantidade_minima NUMERIC(12,3) NOT NULL DEFAULT 0,
  local_armazenamento VARCHAR(80),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE (unidade_id, produto_id)
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  funcionario_id INTEGER REFERENCES funcionarios(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade NUMERIC(12,3) NOT NULL CHECK (quantidade > 0),
  custo_unitario NUMERIC(10,2),
  motivo VARCHAR(150),
  referencia VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservas (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  mesa_id INTEGER REFERENCES mesas(id),
  cliente_id INTEGER REFERENCES clientes(id),
  nome_responsavel VARCHAR(150) NOT NULL,
  telefone_responsavel VARCHAR(20),
  pessoas INTEGER NOT NULL CHECK (pessoas > 0),
  data_hora TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'finalizada')),
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comandas (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  mesa_id INTEGER REFERENCES mesas(id),
  cliente_id INTEGER REFERENCES clientes(id),
  funcionario_abertura_id INTEGER REFERENCES funcionarios(id),
  numero_comanda VARCHAR(30) NOT NULL,
  data_abertura TIMESTAMP DEFAULT NOW(),
  data_fechamento TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  observacoes TEXT,
  UNIQUE (unidade_id, numero_comanda)
);

CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  unidade_id INTEGER NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  comanda_id INTEGER REFERENCES comandas(id) ON DELETE SET NULL,
  mesa_id INTEGER REFERENCES mesas(id) ON DELETE SET NULL,
  cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
  garcom_id INTEGER REFERENCES funcionarios(id),
  tipo_atendimento VARCHAR(20) NOT NULL DEFAULT 'mesa' CHECK (tipo_atendimento IN ('mesa', 'balcao', 'retirada', 'delivery_praia')),
  status VARCHAR(20) NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'preparo', 'entregue', 'fechado', 'cancelado')),
  observacoes TEXT,
  taxa_servico_pct NUMERIC(5,2) DEFAULT 10.00 CHECK (taxa_servico_pct >= 0),
  desconto_valor NUMERIC(10,2) DEFAULT 0 CHECK (desconto_valor >= 0),
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
  status_item VARCHAR(20) NOT NULL DEFAULT 'solicitado' CHECK (status_item IN ('solicitado', 'preparo', 'pronto', 'entregue', 'cancelado')),
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED
);

CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  forma_pagamento VARCHAR(25) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'voucher')),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  troco_para NUMERIC(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmado' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
  pago_em TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE VIEW vw_faturamento_diario AS
SELECT
  p.unidade_id,
  DATE(p.criado_em) AS dia,
  COUNT(DISTINCT p.id) AS pedidos,
  COALESCE(SUM(ip.subtotal), 0)::NUMERIC(12,2) AS bruto,
  COALESCE(SUM(ip.subtotal), 0) - COALESCE(SUM(p.desconto_valor), 0) AS liquido_sem_servico
FROM pedidos p
LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
WHERE p.status IN ('entregue', 'fechado')
GROUP BY p.unidade_id, DATE(p.criado_em);

CREATE OR REPLACE FUNCTION trg_set_pedidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_pedidos_updated_at ON pedidos;
CREATE TRIGGER set_pedidos_updated_at
BEFORE UPDATE ON pedidos
FOR EACH ROW
EXECUTE FUNCTION trg_set_pedidos_updated_at();

-- Seeds básicos para operação inicial
INSERT INTO unidades (nome, cidade, estado, bairro, endereco, telefone)
VALUES ('Restaurante Praia do Sol', 'Fortaleza', 'CE', 'Praia de Iracema', 'Av. Beira Mar, 1000', '(85) 99999-0000')
ON CONFLICT DO NOTHING;

INSERT INTO cargos (nome, descricao)
VALUES
  ('gerente', 'Gestão geral da unidade'),
  ('garcom', 'Atendimento de mesas e barracas'),
  ('cozinheiro', 'Preparo de pratos'),
  ('caixa', 'Fechamento de contas e pagamentos')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO categorias_produto (nome, descricao)
VALUES
  ('Peixes e Frutos do Mar', 'Pratos do mar e petiscos'),
  ('Bebidas', 'Sucos, refrigerantes, cervejas e drinks'),
  ('Sobremesas', 'Doces e sobremesas regionais')
ON CONFLICT (nome) DO NOTHING;

COMMIT;
