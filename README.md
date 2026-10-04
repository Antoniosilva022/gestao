# Sistema de Gestão para Loja de Bijuterias

Sistema completo de gestão para loja de bijuterias e semijoias, com React + Node.js + PostgreSQL.

## Módulos
- Dashboard com gráficos e KPIs
- Clientes
- Peças e Categorias (brincos, colares, anéis, pulseiras, etc.)
- Vendas e PDV
- Controle de Estoque
- Financeiro (contas a pagar/receber)
- Funcionários / RH
- Usuários e controle de acesso (admin/gerente/operador)

Cada peça possui atributos próprios do segmento: material, banho/cor, tamanho/medida e peso em gramas.

## Como rodar

### 1. Banco de dados (com Docker)
```bash
docker compose --env-file backend/.env up -d --build
```
Ou configure um PostgreSQL local e ajuste o `.env`.

O frontend da stack Docker fica em `http://localhost:8080`. Para evitar conflito com serviços locais, defina `BACKEND_PORT` e `FRONTEND_PORT` antes de executar o comando.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações de banco, defina um JWT_SECRET forte
npm run migrate
npm run dev
```

Para executar o frontend em outro endereço, ajuste `CORS_ORIGIN` no `.env` do backend. Separe várias origens por vírgulas.

### Banco PostgreSQL no Render
Configure `DATABASE_URL` nas variáveis de ambiente do serviço do backend usando a URL fornecida pelo Render. Para criar/atualizar as tabelas e inserir o usuário administrador inicial quando ele ainda não existir, execute `npm run migrate` no diretório `backend` com essa variável configurada. O comando não cria bancos no Render: o banco deve existir previamente.

Após a migração, o acesso inicial é `admin@empresa.com` / `admin123`, somente se esse usuário ainda não tiver sido cadastrado. A migração não redefine a senha de uma conta já existente. Altere a senha inicial após entrar.

### Publicar o frontend no Render
O arquivo `render.yaml` configura um Static Site para a pasta `frontend`, com build `npm ci && npm run build`, publicação de `dist` e rewrite para suportar as rotas do React. No Render, crie um Blueprint a partir deste repositório e aplique a configuração. O frontend usará a API definida em `VITE_API_URL`.

Depois que o Static Site for criado, copie a URL pública dele e defina essa URL, sem barra no final, como `CORS_ORIGIN` nas variáveis do serviço backend já existente. O backend precisa permitir a origem do frontend para que o navegador consiga chamar a API.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: **http://localhost:5173**

## Login padrão
- **Email:** admin@empresa.com
- **Senha:** admin123

## Estrutura
```
sass/
├── backend/          # Node.js + Express + PostgreSQL
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── database/
│       ├── middleware/
│       └── routes/
├── frontend/         # React + Vite + Tailwind CSS
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── utils/
└── docker-compose.yml
```
