const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { status, comanda_id } = req.query;
    let query = `
      SELECT p.*,
             c.numero_comanda,
             cl.nome AS cliente_nome,
             u.nome AS usuario_nome,
             COALESCE(SUM(ip.subtotal), 0)::numeric(10,2) AS subtotal
      FROM pedidos p
      LEFT JOIN comandas c ON c.id = p.comanda_id
      LEFT JOIN clientes cl ON cl.id = p.cliente_id
      LEFT JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
      WHERE p.empresa_id = $1
    `;
    const params = [empresaId];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    if (comanda_id) {
      params.push(comanda_id);
      query += ` AND p.comanda_id = $${params.length}`;
    }

    query += ' GROUP BY p.id, c.numero_comanda, cl.nome, u.nome ORDER BY p.criado_em DESC';

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
      `SELECT p.*, c.numero_comanda, cl.nome AS cliente_nome, u.nome AS usuario_nome
       FROM pedidos p
       LEFT JOIN comandas c ON c.id = p.comanda_id
       LEFT JOIN clientes cl ON cl.id = p.cliente_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1 AND p.empresa_id = $2`,
      [req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Pedido não encontrado' });

    const { rows: itens } = await pool.query(
      `SELECT ip.*, pr.nome AS produto_nome
       FROM itens_pedido ip
       JOIN produtos pr ON pr.id = ip.produto_id
       WHERE ip.pedido_id = $1 AND ip.empresa_id = $2
       ORDER BY ip.id`,
      [req.params.id, empresaId]
    );

    const subtotal = itens.reduce((acc, item) => acc + Number(item.subtotal), 0);
    const taxa = subtotal * (Number(rows[0].taxa_servico_pct || 0) / 100);
    const total = subtotal + taxa - Number(rows[0].desconto_valor || 0);

    res.json({ ...rows[0], itens, subtotal, taxa_servico: taxa, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const {
    comanda_id,
    cliente_id,
    mesa_ref,
    status = 'aberto',
    desconto_valor = 0,
    taxa_servico_pct = 10,
    observacoes,
    itens = []
  } = req.body;

  if (!Array.isArray(itens) || !itens.length) {
    return res.status(400).json({ error: 'Informe ao menos um item no pedido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: pedidoRows } = await client.query(
      `INSERT INTO pedidos (empresa_id, comanda_id, cliente_id, usuario_id, mesa_ref, status, desconto_valor, taxa_servico_pct, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [empresaId, comanda_id || null, cliente_id || null, req.usuario.id, mesa_ref || null, status, desconto_valor, taxa_servico_pct, observacoes || null]
    );

    const pedido = pedidoRows[0];

    for (const item of itens) {
      const quantidade = Number(item.quantidade || 0);
      if (quantidade <= 0) {
        throw new Error('Quantidade do item deve ser maior que zero');
      }

      let precoUnitario = item.preco_unitario;
      if (precoUnitario == null) {
        const { rows: produtoRows } = await client.query('SELECT preco FROM produtos WHERE id = $1 AND empresa_id = $2 AND ativo = true', [item.produto_id, empresaId]);
        if (!produtoRows.length) throw new Error(`Produto ${item.produto_id} não encontrado ou inativo`);
        precoUnitario = produtoRows[0].preco;
      }

      await client.query(
        `INSERT INTO itens_pedido (empresa_id, pedido_id, produto_id, quantidade, preco_unitario, observacao, status_item)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [empresaId, pedido.id, item.produto_id, quantidade, precoUnitario, item.observacao || null, item.status_item || 'solicitado']
      );
    }

    await client.query('COMMIT');
    res.status(201).json(pedido);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function atualizar(req, res) {
  const empresaId = req.empresaId;
  const { comanda_id, cliente_id, mesa_ref, status, desconto_valor, taxa_servico_pct, observacoes } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE pedidos
       SET comanda_id = COALESCE($1, comanda_id),
           cliente_id = $2,
           mesa_ref = $3,
           status = COALESCE($4, status),
           desconto_valor = COALESCE($5, desconto_valor),
           taxa_servico_pct = COALESCE($6, taxa_servico_pct),
           observacoes = $7
       WHERE id = $8 AND empresa_id = $9
       RETURNING *`,
      [comanda_id || null, cliente_id || null, mesa_ref || null, status || null, desconto_valor, taxa_servico_pct, observacoes || null, req.params.id, empresaId]
    );

    if (!rows.length) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const { rowCount } = await pool.query('UPDATE pedidos SET status = $1 WHERE id = $2 AND empresa_id = $3', ['cancelado', req.params.id, req.empresaId]);
    if (!rowCount) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscar, criar, atualizar, excluir };