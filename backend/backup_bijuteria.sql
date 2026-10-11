-- Backup Gerado em: 11/10/2026, 20:16:30

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: categorias
-- --------------------------------------------------------

INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (1, 1, 'Brincos', 'Brincos de argola, ear cuff, pressão e furo', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (2, 1, 'Colares', 'Colares, gargantilhas e chokers', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (3, 1, 'Correntes', 'Correntes avulsas e cordões', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (4, 1, 'Pingentes', 'Pingentes e berloques', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (5, 1, 'Anéis', 'Anéis lisos, solitários e falanges', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (6, 1, 'Pulseiras', 'Pulseiras rígidas, elos e de couro', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (7, 1, 'Braceletes', 'Braceletes e algemas', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (8, 1, 'Tornozeleiras', 'Tornozeleiras e pulseiras de pé', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (9, 1, 'Piercings', 'Piercings de orelha, nariz e corpo', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (10, 1, 'Conjuntos', 'Kits e conjuntos combinados', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (11, 1, 'Relógios', 'Relógios femininos e masculinos', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (12, 1, 'Acessórios de Cabelo', 'Presilhas, tiaras, xuxinhas e bicos de pato', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (13, 1, 'Bolsas e Carteiras', 'Bolsas, clutches e carteiras', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (14, 1, 'Óculos', 'Óculos de sol e armações', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (15, 1, 'Semijoias', 'Peças folheadas com garantia estendida', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (16, 1, 'Prata 925', 'Peças em prata de lei', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (17, 1, 'Aço Inoxidável', 'Peças em aço antialérgico', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (18, 1, 'Pedras Naturais', 'Peças com quartzo, ágata e cristais', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (19, 1, 'Infantil', 'Bijuterias infantis e antialérgicas', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (20, 1, 'Masculino', 'Linha masculina de acessórios', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (21, 1, 'Embalagens', 'Caixinhas, saquinhos e sacolas', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (22, 1, 'Expositores', 'Displays, mostruários e organizadores', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (23, 1, 'Insumos e Reparos', 'Fechos, argolas, fios e itens de conserto', '2026-10-04T05:20:04.751Z');
INSERT INTO "categorias" ("id", "empresa_id", "nome", "descricao", "criado_em") VALUES (24, 1, 'Limpeza e Conservação', 'Flanelas, banhos e produtos de limpeza', '2026-10-04T05:20:04.751Z');

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: estoque
-- --------------------------------------------------------

INSERT INTO "estoque" ("id", "empresa_id", "produto_id", "quantidade", "quantidade_minima", "atualizado_em") VALUES (1, 1, 1, 42, 5, '2026-10-04T05:37:44.461Z');
INSERT INTO "estoque" ("id", "empresa_id", "produto_id", "quantidade", "quantidade_minima", "atualizado_em") VALUES (3, 1, 3, 7, 1, '2026-10-11T22:33:26.411Z');
INSERT INTO "estoque" ("id", "empresa_id", "produto_id", "quantidade", "quantidade_minima", "atualizado_em") VALUES (2, 1, 2, 34, 2, '2026-10-12T00:52:01.867Z');

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: funcionarios
-- --------------------------------------------------------

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: usuarios
-- --------------------------------------------------------

INSERT INTO "usuarios" ("id", "nome", "email", "senha", "perfil", "ativo", "criado_em", "empresa_id") VALUES (1, 'Administrador', 'admin@empresa.com', '$2a$10$MYhWkSU/7E8KWjP88MkuuO5rGC2L.Y0CnO1t9EbVHxGANrejU4UpC', 'admin', true, '2026-10-04T05:20:04.751Z', 1);

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: clientes
-- --------------------------------------------------------

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: movimentacoes_estoque
-- --------------------------------------------------------

INSERT INTO "movimentacoes_estoque" ("id", "produto_id", "tipo", "quantidade", "motivo", "usuario_id", "criado_em", "empresa_id") VALUES (1, 1, 'saida', '1.000', 'Venda #1', 1, '2026-10-04T05:37:44.461Z', 1);
INSERT INTO "movimentacoes_estoque" ("id", "produto_id", "tipo", "quantidade", "motivo", "usuario_id", "criado_em", "empresa_id") VALUES (2, 2, 'saida', '1.000', 'Venda #2', 1, '2026-10-12T00:52:01.867Z', 1);

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: vendas
-- --------------------------------------------------------

INSERT INTO "vendas" ("id", "cliente_id", "usuario_id", "status", "subtotal", "desconto", "total", "forma_pagamento", "observacoes", "criado_em", "empresa_id") VALUES (1, NULL, 1, 'fechada', '57.00', '0.04', '56.96', 'PIX', '', '2026-10-04T05:37:44.461Z', 1);
INSERT INTO "vendas" ("id", "cliente_id", "usuario_id", "status", "subtotal", "desconto", "total", "forma_pagamento", "observacoes", "criado_em", "empresa_id") VALUES (2, NULL, 1, 'fechada', '18.99', '0.00', '18.99', 'Cheque', '', '2026-10-12T00:52:01.867Z', 1);

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: itens_venda
-- --------------------------------------------------------

INSERT INTO "itens_venda" ("id", "venda_id", "produto_id", "quantidade", "preco_unitario", "desconto", "total", "empresa_id") VALUES (1, 1, 1, '1.000', '57.00', '0.00', '57.00', 1);
INSERT INTO "itens_venda" ("id", "venda_id", "produto_id", "quantidade", "preco_unitario", "desconto", "total", "empresa_id") VALUES (2, 2, 2, '1.000', '18.99', '0.00', '18.99', 1);

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: contas
-- --------------------------------------------------------

INSERT INTO "contas" ("id", "tipo", "descricao", "valor", "vencimento", "pagamento", "status", "categoria", "cliente_id", "funcionario_id", "venda_id", "observacoes", "criado_em", "empresa_id") VALUES (1, 'receber', 'Venda #1', '56.96', '2026-11-03T03:00:00.000Z', NULL, 'pendente', 'Vendas', NULL, NULL, 1, NULL, '2026-10-04T05:37:44.461Z', 1);
INSERT INTO "contas" ("id", "tipo", "descricao", "valor", "vencimento", "pagamento", "status", "categoria", "cliente_id", "funcionario_id", "venda_id", "observacoes", "criado_em", "empresa_id") VALUES (2, 'receber', 'Venda #2', '18.99', '2026-11-10T03:00:00.000Z', NULL, 'pendente', 'Vendas', NULL, NULL, 2, NULL, '2026-10-12T00:52:01.867Z', 1);

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: produtos
-- --------------------------------------------------------

INSERT INTO "produtos" ("id", "empresa_id", "nome", "descricao", "preco", "custo", "unidade", "categoria_id", "codigo", "ativo", "criado_em", "material", "banho", "tamanho", "peso_gramas") VALUES (1, 1, 'cordão de ouro 18 k', '', '57.00', '45.00', 'UN', 2, '1234', true, '2026-10-04T05:34:17.762Z', 'ouro', 'Ouro 18k', '16cm', '1.87');
INSERT INTO "produtos" ("id", "empresa_id", "nome", "descricao", "preco", "custo", "unidade", "categoria_id", "codigo", "ativo", "criado_em", "material", "banho", "tamanho", "peso_gramas") VALUES (2, 1, 'brinco ', '', '18.99', '15.88', 'UN', 1, '453', true, '2026-10-11T06:18:28.950Z', 'Prata 925', 'Ouro 18k', '01', '0.03');
INSERT INTO "produtos" ("id", "empresa_id", "nome", "descricao", "preco", "custo", "unidade", "categoria_id", "codigo", "ativo", "criado_em", "material", "banho", "tamanho", "peso_gramas") VALUES (3, 1, 'pulseiras', '', '567.00', '34.00', 'UN', 6, '678', true, '2026-10-11T22:33:26.411Z', 'ouro 18k', 'Ouro 18k', '0,25 cm', '0.35');

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: empresas
-- --------------------------------------------------------

INSERT INTO "empresas" ("id", "nome", "slug", "ativo", "criado_em") VALUES (1, 'Bijuteria Demo', 'bijuteria-demo', true, '2026-10-04T05:20:04.751Z');

-- --------------------------------------------------------
-- Estrutura e Dados da tabela: auditoria_eventos
-- --------------------------------------------------------

