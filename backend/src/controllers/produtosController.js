const { pool } = require('../config/database');

function normalizeCategoriaId(categoriaId) {
  return categoriaId === '' || categoriaId === undefined ? null : categoriaId;
}

function normalizeEstoqueValue(value) {
  if (value === '' || value === undefined || value === null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { search = '', ativo = 'true' } = req.query;
    const { rows } = await pool.query(
      `SELECT p.*, c.nome as categoria_nome, COALESCE(e.quantidade, 0) as estoque_atual
             , COALESCE(e.quantidade_minima, 0) as quantidade_minima
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id AND c.empresa_id = p.empresa_id
       LEFT JOIN estoque e ON e.produto_id = p.id AND e.empresa_id = p.empresa_id
       WHERE p.empresa_id = $1 AND p.ativo = $2 AND (p.nome ILIKE $3 OR p.codigo ILIKE $3)
       ORDER BY p.nome`,
      [empresaId, ativo === 'true', `%${search}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarCardapio(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nome, p.descricao, p.preco, c.nome AS categoria_nome
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id AND c.empresa_id = p.empresa_id
       WHERE p.empresa_id = $1 AND p.ativo = true
       ORDER BY c.nome NULLS LAST, p.nome`,
      [req.empresaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { rows } = await pool.query(
      `SELECT p.*, c.nome as categoria_nome, COALESCE(e.quantidade, 0) as estoque_atual
             , COALESCE(e.quantidade_minima, 0) as quantidade_minima
       FROM produtos p
       LEFT JOIN categorias c ON c.id = p.categoria_id AND c.empresa_id = p.empresa_id
       LEFT JOIN estoque e ON e.produto_id = p.id AND e.empresa_id = p.empresa_id
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
  const { nome, descricao, preco, custo, unidade, categoria_id, codigo, estoque_atual, quantidade_minima } = req.body;
  const categoriaId = normalizeCategoriaId(categoria_id);
  const estoqueInicial = normalizeEstoqueValue(estoque_atual);
  const estoqueMinimo = normalizeEstoqueValue(quantidade_minima);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO produtos (empresa_id, nome, descricao, preco, custo, unidade, categoria_id, codigo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [empresaId, nome, descricao, preco, custo, unidade, categoriaId, codigo]
    );
    await client.query(
      'INSERT INTO estoque (empresa_id, produto_id, quantidade, quantidade_minima) VALUES ($1, $2, $3, $4)',
      [empresaId, rows[0].id, estoqueInicial, estoqueMinimo]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function atualizar(req, res) {
  const empresaId = req.empresaId;
  const { nome, descricao, preco, custo, unidade, categoria_id, codigo, ativo, estoque_atual, quantidade_minima } = req.body;
  const categoriaId = normalizeCategoriaId(categoria_id);
  const estoqueAtual = normalizeEstoqueValue(estoque_atual);
  const estoqueMinimo = normalizeEstoqueValue(quantidade_minima);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE produtos SET nome=$1, descricao=$2, preco=$3, custo=$4, unidade=$5, categoria_id=$6, codigo=$7, ativo=$8
       WHERE id=$9 AND empresa_id = $10 RETURNING *`,
      [nome, descricao, preco, custo, unidade, categoriaId, codigo, ativo, req.params.id, empresaId]
    );
    if (!rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    await client.query(
      `UPDATE estoque
       SET quantidade = $1, quantidade_minima = $2, atualizado_em = NOW()
       WHERE produto_id = $3 AND empresa_id = $4`,
      [estoqueAtual, estoqueMinimo, req.params.id, empresaId]
    );
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function excluir(req, res) {
  try {
    await pool.query('UPDATE produtos SET ativo = false WHERE id = $1 AND empresa_id = $2', [req.params.id, req.empresaId]);
    res.json({ message: 'Produto desativado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarCategorias(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM categorias WHERE empresa_id = $1 ORDER BY nome', [req.empresaId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criarCategoria(req, res) {
  try {
    const { rows } = await pool.query(
      'INSERT INTO categorias (empresa_id, nome, descricao) VALUES ($1, $2, $3) RETURNING *',
      [req.empresaId, req.body.nome, req.body.descricao]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, listarCardapio, buscar, criar, atualizar, excluir, listarCategorias, criarCategoria };
