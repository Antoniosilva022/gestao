const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { status } = req.query;
    let query = `
      SELECT c.*, cl.nome AS cliente_nome, u.nome AS usuario_abertura_nome
      FROM comandas c
      LEFT JOIN clientes cl ON cl.id = c.cliente_id
      LEFT JOIN usuarios u ON u.id = c.usuario_abertura_id
      WHERE c.empresa_id = $1
    `;
    const params = [empresaId];

    if (status) {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    query += ' ORDER BY c.criado_em DESC';

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
      `SELECT c.*, cl.nome AS cliente_nome, u.nome AS usuario_abertura_nome
       FROM comandas c
       LEFT JOIN clientes cl ON cl.id = c.cliente_id
       LEFT JOIN usuarios u ON u.id = c.usuario_abertura_id
       WHERE c.id = $1 AND c.empresa_id = $2`,
      [req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Comanda não encontrada' });

    const { rows: pedidos } = await pool.query(
      `SELECT p.id, p.status, p.criado_em,
              COALESCE(SUM(ip.subtotal), 0)::numeric(10,2) AS subtotal
       FROM pedidos p
       LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
       WHERE p.comanda_id = $1 AND p.empresa_id = $2
       GROUP BY p.id
       ORDER BY p.criado_em DESC`,
      [req.params.id, empresaId]
    );

    res.json({ ...rows[0], pedidos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const { numero_comanda, mesa_ref, cliente_id, observacoes } = req.body;
  if (!numero_comanda) {
    return res.status(400).json({ error: 'Número da comanda é obrigatório' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO comandas (empresa_id, numero_comanda, mesa_ref, cliente_id, usuario_abertura_id, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [empresaId, numero_comanda, mesa_ref || null, cliente_id || null, req.usuario.id, observacoes || null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function atualizar(req, res) {
  const empresaId = req.empresaId;
  const { numero_comanda, mesa_ref, cliente_id, status, observacoes } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE comandas
       SET numero_comanda = COALESCE($1, numero_comanda),
           mesa_ref = $2,
           cliente_id = $3,
           status = COALESCE($4, status),
           observacoes = $5,
           fechado_em = CASE WHEN COALESCE($4, status) = 'fechada' THEN NOW() ELSE fechado_em END
       WHERE id = $6 AND empresa_id = $7
       RETURNING *`,
      [numero_comanda || null, mesa_ref || null, cliente_id || null, status || null, observacoes || null, req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Comanda não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query(
      `UPDATE comandas SET status = 'cancelada', fechado_em = NOW() WHERE id = $1 AND empresa_id = $2`,
      [req.params.id, req.empresaId]
    );

    if (!rowCount) return res.status(404).json({ error: 'Comanda não encontrada' });
    res.json({ message: 'Comanda cancelada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };