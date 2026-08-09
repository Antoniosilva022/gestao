const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { search = '', ativo = 'true' } = req.query;
    const { rows } = await pool.query(
      `SELECT * FROM clientes WHERE empresa_id = $1 AND ativo = $2 AND (nome ILIKE $3 OR email ILIKE $3 OR cpf_cnpj ILIKE $3) ORDER BY nome`,
      [empresaId, ativo === 'true', `%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscar(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1 AND empresa_id = $2', [req.params.id, req.empresaId]);
    if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const { nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO clientes (empresa_id, nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.empresaId, nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function atualizar(req, res) {
  const { nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep, ativo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE clientes SET nome=$1, email=$2, telefone=$3, cpf_cnpj=$4, endereco=$5, cidade=$6, estado=$7, cep=$8, ativo=$9
       WHERE id=$10 AND empresa_id = $11 RETURNING *`,
      [nome, email, telefone, cpf_cnpj, endereco, cidade, estado, cep, ativo, req.params.id, req.empresaId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    await pool.query('UPDATE clientes SET ativo = false WHERE id = $1 AND empresa_id = $2', [req.params.id, req.empresaId]);
    res.json({ message: 'Cliente desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };
