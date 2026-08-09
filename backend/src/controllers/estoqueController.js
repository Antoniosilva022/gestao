const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, p.nome as produto_nome, p.unidade, p.codigo
       FROM estoque e JOIN produtos p ON p.id = e.produto_id
       WHERE e.empresa_id = $1 AND p.empresa_id = $1 AND p.ativo = true ORDER BY p.nome`,
      [req.empresaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function estoqueBaixo(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, p.nome as produto_nome, p.unidade
       FROM estoque e JOIN produtos p ON p.id = e.produto_id
       WHERE e.empresa_id = $1 AND p.empresa_id = $1 AND e.quantidade <= e.quantidade_minima AND p.ativo = true ORDER BY p.nome`,
      [req.empresaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function movimentar(req, res) {
  const empresaId = req.empresaId;
  const { produto_id, tipo, quantidade, motivo } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (tipo === 'saida') {
      const { rows } = await client.query('SELECT quantidade FROM estoque WHERE produto_id = $1 AND empresa_id = $2', [produto_id, empresaId]);
      if (!rows.length || rows[0].quantidade < quantidade) {
        throw new Error('Estoque insuficiente');
      }
    }
    const op = tipo === 'entrada' ? '+' : '-';
    await client.query(
      `UPDATE estoque SET quantidade = quantidade ${op} $1, atualizado_em = NOW() WHERE produto_id = $2 AND empresa_id = $3`,
      [quantidade, produto_id, empresaId]
    );
    const { rows } = await client.query(
      `INSERT INTO movimentacoes_estoque (empresa_id, produto_id, tipo, quantidade, motivo, usuario_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [empresaId, produto_id, tipo, quantidade, motivo, req.usuario.id]
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

async function historico(req, res) {
  try {
    const empresaId = req.empresaId;
    const { produto_id } = req.query;
    let query = `SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome
                 FROM movimentacoes_estoque m
                 JOIN produtos p ON p.id = m.produto_id
                 LEFT JOIN usuarios u ON u.id = m.usuario_id
                 WHERE m.empresa_id = $1 AND p.empresa_id = $1`;
    const params = [empresaId];
    if (produto_id) { params.push(produto_id); query += ` AND m.produto_id = $${params.length}`; }
    query += ' ORDER BY m.criado_em DESC LIMIT 100';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, estoqueBaixo, movimentar, historico };
