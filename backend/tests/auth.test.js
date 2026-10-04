const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test_secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/config/database');
const app = require('../src/app');

const authHeader = {
  Authorization: `Bearer ${jwt.sign({ id: 1, empresa_id: 1, perfil: 'admin' }, process.env.JWT_SECRET)}`
};

test('GET /health retorna status ok', async () => {
  const originalQuery = pool.query;
  pool.query = async () => ({ rows: [{ '?column?': 1 }] });

  try {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  } finally {
    pool.query = originalQuery;
  }
});

test('GET /health informa indisponibilidade do banco', async () => {
  const originalQuery = pool.query;
  pool.query = async () => { throw new Error('Banco indisponível'); };

  try {
    const res = await request(app).get('/health');
    assert.equal(res.status, 503);
    assert.deepEqual(res.body, { status: 'unavailable' });
  } finally {
    pool.query = originalQuery;
  }
});

test('POST /api/auth/login rejeita email invalido antes de tocar no banco', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'nao-e-email', senha: '123456' });
  assert.equal(res.status, 400);
});

test('POST /api/auth/login rejeita senha vazia', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'user@empresa.com', senha: '' });
  assert.equal(res.status, 400);
});

test('POST /api/auth/login normaliza espaços e maiúsculas do email', async () => {
  const originalQuery = pool.query;
  const senhaHash = await bcrypt.hash('senha-segura', 4);
  pool.query = async (query, params) => {
    assert.match(query, /LOWER\(email\)/);
    assert.deepEqual(params, ['user@empresa.com', 1]);
    return {
      rows: [{
        id: 3,
        nome: 'Usuário de teste',
        email: 'user@empresa.com',
        senha: senhaHash,
        perfil: 'admin',
        empresa_id: 1
      }]
    };
  };

  try {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ' USER@EMPRESA.COM ', senha: 'senha-segura' });

    assert.equal(res.status, 200);
    assert.equal(res.body.usuario.email, 'user@empresa.com');
    assert.ok(res.body.token);
  } finally {
    pool.query = originalQuery;
  }
});

test('POST /api/vendas rejeita item sem quantidade antes de acessar o banco', async () => {
  const originalConnect = pool.connect;
  let connected = false;
  pool.connect = async () => { connected = true; };

  try {
    const res = await request(app)
      .post('/api/vendas')
      .set(authHeader)
      .send({ itens: [{ produto_id: 1, quantidade: 0 }] });

    assert.equal(res.status, 400);
    assert.equal(connected, false);
  } finally {
    pool.connect = originalConnect;
  }
});

test('perfil desconhecido não pode acessar clientes', async () => {
  const token = jwt.sign({ id: 2, empresa_id: 1, perfil: 'visitante' }, process.env.JWT_SECRET);
  const res = await request(app)
    .get('/api/clientes')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
});
