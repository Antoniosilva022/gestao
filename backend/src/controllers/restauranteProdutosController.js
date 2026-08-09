const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { search = '', disponivel } = req.query;
    let query = `
      SELECT p.id, p.nome, p.descricao, p.preco, p.custo, p.unidade, p.categoria_id,
             p.codigo, p.ativo AS disponivel, p.criado_em
      FROM produtos p
      WHERE p.empresa_id = $1
    `;
    const params = [empresaId];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.nome ILIKE $${params.length} OR COALESCE(p.codigo, '') ILIKE $${params.length})`;
    }

    if (typeof disponivel !== 'undefined') {
      params.push(disponivel === 'true');
      query += ` AND p.ativo = $${params.length}`;
    }

    query += ' ORDER BY p.nome';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { rows } = await pool.query(
      `SELECT p.id, p.nome, p.descricao, p.preco, p.custo, p.unidade, p.categoria_id,
              p.codigo, p.ativo AS disponivel, p.criado_em
       FROM produtos p
       WHERE p.id = $1 AND p.empresa_id = $2`,
      [req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const { nome, descricao, preco, custo = 0, unidade = 'UN', categoria_id, codigo } = req.body;

  if (!nome || preco == null) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO produtos (empresa_id, nome, descricao, preco, custo, unidade, categoria_id, codigo, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, nome, descricao, preco, custo, unidade, categoria_id, codigo, ativo AS disponivel, criado_em`,
      [empresaId, nome, descricao || null, preco, custo, unidade, categoria_id || null, codigo || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function atualizar(req, res) {
  const empresaId = req.empresaId;
  const { nome, descricao, preco, custo = 0, unidade = 'UN', categoria_id, codigo, disponivel = true } = req.body;

  if (!nome || preco == null) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE produtos
       SET nome = $1,
           descricao = $2,
           preco = $3,
           custo = $4,
           unidade = $5,
           categoria_id = $6,
           codigo = $7,
           ativo = $8
       WHERE id = $9 AND empresa_id = $10
       RETURNING id, nome, descricao, preco, custo, unidade, categoria_id, codigo, ativo AS disponivel, criado_em`,
      [nome, descricao || null, preco, custo, unidade, categoria_id || null, codigo || null, !!disponivel, req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query('UPDATE produtos SET ativo = false WHERE id = $1 AND empresa_id = $2', [req.params.id, req.empresaId]);
    if (!rowCount) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };
