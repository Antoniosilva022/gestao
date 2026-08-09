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
    { nome: 'Notebook Ultra', receita: 12800 },
    { nome: 'Mouse Sem Fio', receita: 9600 },
    { nome: 'Teclado Mecânico', receita: 8420 },
    { nome: 'Monitor 27"', receita: 7100 },
    { nome: 'Webcam HD', receita: 5900 }
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
  { id: 1, codigo: 'NTB-001', nome: 'Notebook Ultra', categoria_nome: 'Eletrônicos', preco: 4999, custo: 3200, estoque_atual: 12, unidade: 'UN' },
  { id: 2, codigo: 'MOU-002', nome: 'Mouse Sem Fio', categoria_nome: 'Periféricos', preco: 189, custo: 95, estoque_atual: 40, unidade: 'UN' },
  { id: 3, codigo: 'TEC-003', nome: 'Teclado Mecânico', categoria_nome: 'Periféricos', preco: 349, custo: 185, estoque_atual: 18, unidade: 'UN' }
];

export const demoCategorias = [
  { id: 1, nome: 'Entradas' },
  { id: 2, nome: 'Saladas' },
  { id: 3, nome: 'Pratos Principais' },
  { id: 4, nome: 'Massas' },
  { id: 5, nome: 'Pizzas' },
  { id: 6, nome: 'Lanches' },
  { id: 7, nome: 'Hambúrgueres' },
  { id: 8, nome: 'Porções' },
  { id: 9, nome: 'Sobremesas' },
  { id: 10, nome: 'Sorvetes' },
  { id: 11, nome: 'Bebidas' },
  { id: 12, nome: 'Refrigerantes' },
  { id: 13, nome: 'Sucos' },
  { id: 14, nome: 'Águas' },
  { id: 15, nome: 'Cafés' },
  { id: 16, nome: 'Chás' },
  { id: 17, nome: 'Cervejas' },
  { id: 18, nome: 'Vinhos' },
  { id: 19, nome: 'Drinks' },
  { id: 20, nome: 'Molhos e Complementos' },
  { id: 21, nome: 'Carnes' },
  { id: 22, nome: 'Frangos' },
  { id: 23, nome: 'Peixes e Frutos do Mar' },
  { id: 24, nome: 'Acompanhamentos' },
  { id: 25, nome: 'Padaria e Café da Manhã' },
  { id: 26, nome: 'Ingredientes' },
  { id: 27, nome: 'Embalagens' },
  { id: 28, nome: 'Limpeza e Higiene' }
];

export const demoVendas = [
  { id: 1, cliente_nome: 'Maria Silva', criado_em: '2026-08-01T10:30:00', total: 4999, forma_pagamento: 'Cartão', status: 'fechada' },
  { id: 2, cliente_nome: 'João Pereira', criado_em: '2026-08-02T14:00:00', total: 538, forma_pagamento: 'Pix', status: 'aberta' }
];

export const demoEstoque = [
  { id: 1, produto_nome: 'Notebook Ultra', estoque_atual: 12, estoque_minimo: 5 },
  { id: 2, produto_nome: 'Mouse Sem Fio', estoque_atual: 40, estoque_minimo: 10 }
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
  { id: 3, nome: 'Rafael Nunes', cargo: 'Suporte', status: 'ferias' }
];

export const demoUsuarios = [
  { id: 1, nome: 'Admin Demo', email: 'admin@empresa.com', perfil: 'admin' }
];
