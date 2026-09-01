# Sistema de Gestão de Empresa

Sistema completo de gestão empresarial com React + Node.js + PostgreSQL.

## Módulos
- Dashboard com gráficos e KPIs
- Clientes
- Produtos e Categorias
- Vendas e PDV
- Controle de Estoque
- Financeiro (contas a pagar/receber)
- Funcionários / RH
- Usuários e controle de acesso (admin/gerente/operador)

## Como rodar

### 1. Banco de dados (com Docker)
```bash
docker-compose up -d
```
Ou configure um PostgreSQL local e ajuste o `.env`.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações de banco, defina um JWT_SECRET forte
npm run migrate
npm run dev
```

Para executar o frontend em outro endereço, ajuste `CORS_ORIGIN` no `.env` do backend.

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
