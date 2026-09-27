export const demoAuthUser = {
  id: 1,
  nome: 'Admin Demo',
  email: 'admin@empresa.com',
  perfil: 'admin'
};

export const demoDashboard = {
  resumo: {
    receita_mes: 185000,
    lucro_mes: 62000
  },
  total_clientes: 24,
  financeiro: {
    total_receber: 18250,
    total_pagar: 7600,
    contas_vencidas: 3
  },
  estoque_alerta: 4,
  vendas_por_mes: [
    { mes: 'Jan', total: 140000 },
    { mes: 'Fev', total: 162000 },
    { mes: 'Mar', total: 170000 },
    { mes: 'Abr', total: 185000 },
    { mes: 'Mai', total: 192000 },
    { mes: 'Jun', total: 210000 }
  ],
  top_produtos: [
    { nome: 'Brinco Argola Folheado', receita: 12800 },
    { nome: 'Colar Ponto de Luz', receita: 9600 },
    { nome: 'Anel Solitário Prata 925', receita: 8420 },
    { nome: 'Pulseira Elos Dourada', receita: 7100 },
    { nome: 'Conjunto Pérolas', receita: 5900 }
  ],
  funcionarios: [
    { status: 'ativos', count: 8 },
    { status: 'ferias', count: 2 },
    { status: 'inativos', count: 1 }
  ]
};

export const demoClientes = [
  { id: 1, nome: 'Maria Silva', email: 'maria@email.com', telefone: '(11) 99999-1111', cpf_cnpj: '123.456.789-00', cidade: 'São Paulo', estado: 'SP' },
  { id: 2, nome: 'João Pereira', email: 'joao@email.com', telefone: '(11) 98888-2222', cpf_cnpj: '98.765.432/0001-10', cidade: 'Campinas', estado: 'SP' },
  { id: 3, nome: 'Ana Costa', email: 'ana@email.com', telefone: '(21) 97777-3333', cpf_cnpj: '456.789.123-00', cidade: 'Rio de Janeiro', estado: 'RJ' }
];

export const demoProdutos = [
  { id: 1, codigo: 'BRI-001', nome: 'Brinco Argola Folheado', categoria_nome: 'Brincos', preco: 89.9, custo: 32, estoque_atual: 24, unidade: 'PAR', material: 'Latão', banho: 'Ouro 18k', tamanho: '3 cm', peso_gramas: 4.5 },
  { id: 2, codigo: 'COL-002', nome: 'Colar Ponto de Luz', categoria_nome: 'Colares', preco: 129.9, custo: 48, estoque_atual: 15, unidade: 'UN', material: 'Prata 925', banho: 'Ródio', tamanho: '45 cm', peso_gramas: 3.2 },
  { id: 3, codigo: 'ANE-003', nome: 'Anel Solitário Prata 925', categoria_nome: 'Anéis', preco: 149.9, custo: 62, estoque_atual: 10, unidade: 'UN', material: 'Prata 925', banho: 'Ródio', tamanho: '16', peso_gramas: 2.8 }
];

export const demoCategorias = [
  { id: 1, nome: 'Brincos' },
  { id: 2, nome: 'Colares' },
  { id: 3, nome: 'Correntes' },
  { id: 4, nome: 'Pingentes' },
  { id: 5, nome: 'Anéis' },
  { id: 6, nome: 'Pulseiras' },
  { id: 7, nome: 'Braceletes' },
  { id: 8, nome: 'Tornozeleiras' },
  { id: 9, nome: 'Piercings' },
  { id: 10, nome: 'Conjuntos' },
  { id: 11, nome: 'Relógios' },
  { id: 12, nome: 'Acessórios de Cabelo' },
  { id: 13, nome: 'Bolsas e Carteiras' },
  { id: 14, nome: 'Óculos' },
  { id: 15, nome: 'Semijoias' },
  { id: 16, nome: 'Prata 925' },
  { id: 17, nome: 'Aço Inoxidável' },
  { id: 18, nome: 'Pedras Naturais' },
  { id: 19, nome: 'Infantil' },
  { id: 20, nome: 'Masculino' },
  { id: 21, nome: 'Embalagens' },
  { id: 22, nome: 'Expositores' },
  { id: 23, nome: 'Insumos e Reparos' },
  { id: 24, nome: 'Limpeza e Conservação' }
];

export const demoVendas = [
  { id: 1, cliente_nome: 'Maria Silva', criado_em: '2026-08-01T10:30:00', total: 219.8, forma_pagamento: 'Cartão', status: 'fechada' },
  { id: 2, cliente_nome: 'João Pereira', criado_em: '2026-08-02T14:00:00', total: 89.9, forma_pagamento: 'Pix', status: 'aberta' }
];

export const demoEstoque = [
  { id: 1, produto_nome: 'Brinco Argola Folheado', estoque_atual: 24, estoque_minimo: 6 },
  { id: 2, produto_nome: 'Colar Ponto de Luz', estoque_atual: 15, estoque_minimo: 5 }
];

export const demoFinanceiro = {
  contas_receber: [
    { id: 1, descricao: 'Cliente A', valor: 1250, vencimento: '2026-08-15' },
    { id: 2, descricao: 'Cliente B', valor: 7000, vencimento: '2026-08-20' }
  ],
  contas_pagar: [
    { id: 1, descricao: 'Fornecedor X', valor: 3600, vencimento: '2026-08-12' }
  ]
};

export const demoFuncionarios = [
  { id: 1, nome: 'Carlos Mendes', cargo: 'Gerente', status: 'ativo' },
  { id: 2, nome: 'Beatriz Lima', cargo: 'Vendedora', status: 'ativo' },
  { id: 3, nome: 'Rafael Nunes', cargo: 'Estoquista', status: 'ferias' }
];

export const demoUsuarios = [
  { id: 1, nome: 'Admin Demo', email: 'admin@empresa.com', perfil: 'admin' }
];
