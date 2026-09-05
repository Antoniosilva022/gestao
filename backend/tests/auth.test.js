const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test_secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';

const request = require('supertest');
const app = require('../src/app');

test('GET /health retorna status ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('POST /api/auth/login rejeita email invalido antes de tocar no banco', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'nao-e-email', senha: '123456' });
  assert.equal(res.status, 400);
});

test('POST /api/auth/login rejeita senha vazia', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'user@empresa.com', senha: '' });
  assert.equal(res.status, 400);
});
