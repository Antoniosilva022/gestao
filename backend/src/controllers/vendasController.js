const { pool } = require('../config/database');

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { status, data_inicio, data_fim, somente_inconsistencias } = req.query;
    const inconsistenciaExpr = `EXISTS (
      WITH item_q AS (
        SELECT iv.produto_id, SUM(iv.quantidade) AS item_qtd
        FROM itens_venda iv
        WHERE iv.venda_id = v.id AND iv.empresa_id = v.empresa_id
        GROUP BY iv.produto_id
      ),
      mov_q AS (
        SELECT m.produto_id,
               SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade ELSE 0 END) AS saida_qtd,
               SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade ELSE 0 END) AS entrada_qtd
        FROM movimentacoes_estoque m
        WHERE m.empresa_id = v.empresa_id
          AND m.motivo IN ('Venda #' || v.id::text, 'Cancelamento da venda #' || v.id::text)
        GROUP BY m.produto_id
      )
      SELECT 1
      FROM (
        SELECT
          COALESCE(i.produto_id, m.produto_id) AS produto_id,
          COALESCE(i.item_qtd, 0) AS item_qtd,
          COALESCE(m.saida_qtd, 0) AS saida_qtd,
          COALESCE(m.entrada_qtd, 0) AS entrada_qtd
        FROM item_q i
        FULL JOIN mov_q m ON m.produto_id = i.produto_id
      ) audit
      WHERE audit.saida_qtd <> audit.item_qtd
         OR (v.status = 'cancelada' AND audit.entrada_qtd < audit.item_qtd)
         OR (v.status <> 'cancelada' AND audit.entrada_qtd > 0)
    )`;

    let query = `SELECT v.*, c.nome as cliente_nome, u.nome as usuario_nome
                 , ${inconsistenciaExpr} as tem_inconsistencia
                 FROM vendas v
                 LEFT JOIN clientes c ON c.id = v.cliente_id
                 LEFT JOIN usuarios u ON u.id = v.usuario_id
                 WHERE v.empresa_id = $1`;
    const params = [empresaId];
    if (status) { params.push(status); query += ` AND v.status = $${params.length}`; }
    if (data_inicio) { params.push(data_inicio); query += ` AND v.criado_em >= $${params.length}`; }
    if (data_fim) { params.push(data_fim); query += ` AND v.criado_em <= $${params.length}`; }
    if (somente_inconsistencias === 'true') {
      query += ` AND ${inconsistenciaExpr}`;
    }
    query += ' ORDER BY v.criado_em DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function relatorioResumo(req, res) {
  try {
    const empresaId = req.empresaId;
    const { data_inicio, data_fim } = req.query;
    const params = [empresaId];
    let where = 'WHERE v.empresa_id = $1 AND v.status != \'cancelada\'';

    if (data_inicio) {
      params.push(data_inicio);
      where += ` AND DATE(v.criado_em) >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      where += ` AND DATE(v.criado_em) <= $${params.length}`;
    }

    const { rows: [resumo] } = await pool.query(
      `SELECT
         COUNT(*)::int AS total_vendas,
         COALESCE(SUM(v.total), 0)::numeric(12,2) AS faturamento_total,
         COALESCE(AVG(v.total), 0)::numeric(12,2) AS ticket_medio
       FROM vendas v
       ${where}`,
      params
    );

    res.json(resumo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function relatorioPorProduto(req, res) {
  try {
    const empresaId = req.empresaId;
    const { data_inicio, data_fim, limite } = req.query;
    const top = Math.min(Number(limite || 20), 100);
    const params = [empresaId];
    let where = 'WHERE v.empresa_id = $1 AND iv.empresa_id = $1 AND v.status != \'cancelada\'';

    if (data_inicio) {
      params.push(data_inicio);
      where += ` AND DATE(v.criado_em) >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      where += ` AND DATE(v.criado_em) <= $${params.length}`;
    }

    params.push(top);

    const { rows } = await pool.query(
      `SELECT
         p.id,
         p.nome,
         SUM(iv.quantidade)::numeric(12,3) AS quantidade_vendida,
         COALESCE(SUM(iv.total), 0)::numeric(12,2) AS faturamento
       FROM itens_venda iv
       JOIN vendas v ON v.id = iv.venda_id
       JOIN produtos p ON p.id = iv.produto_id AND p.empresa_id = iv.empresa_id
       ${where}
       GROUP BY p.id, p.nome
       ORDER BY faturamento DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function relatorioPorPagamento(req, res) {
  try {
    const empresaId = req.empresaId;
    const { data_inicio, data_fim } = req.query;
    const params = [empresaId];
    let where = 'WHERE v.empresa_id = $1 AND v.status != \'cancelada\'';

    if (data_inicio) {
      params.push(data_inicio);
      where += ` AND DATE(v.criado_em) >= $${params.length}`;
    }
    if (data_fim) {
      params.push(data_fim);
      where += ` AND DATE(v.criado_em) <= $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT
         COALESCE(NULLIF(TRIM(v.forma_pagamento), ''), 'Não informado') AS forma_pagamento,
         COUNT(*)::int AS vendas,
         COALESCE(SUM(v.total), 0)::numeric(12,2) AS faturamento
       FROM vendas v
       ${where}
       GROUP BY COALESCE(NULLIF(TRIM(v.forma_pagamento), ''), 'Não informado')
       ORDER BY faturamento DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscar(req, res) {
  try {
    const empresaId = req.empresaId;
    const vendaId = Number(req.params.id);
    const { rows: [venda] } = await pool.query(
      `SELECT v.*, c.nome as cliente_nome, u.nome as usuario_nome
       FROM vendas v LEFT JOIN clientes c ON c.id = v.cliente_id LEFT JOIN usuarios u ON u.id = v.usuario_id
       WHERE v.id = $1 AND v.empresa_id = $2`, [vendaId, empresaId]
    );
    if (!venda) return res.status(404).json({ error: 'Venda não encontrada' });
    const { rows: itens } = await pool.query(
      `SELECT iv.*, p.nome as produto_nome FROM itens_venda iv JOIN produtos p ON p.id = iv.produto_id WHERE iv.venda_id = $1 AND iv.empresa_id = $2`,
      [vendaId, empresaId]
    );

    const { rows: movimentacoes } = await pool.query(
      `SELECT m.*, p.nome as produto_nome, u.nome as usuario_nome
       FROM movimentacoes_estoque m
       JOIN produtos p ON p.id = m.produto_id AND p.empresa_id = m.empresa_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.empresa_id = $1
         AND m.motivo IN ('Venda #' || $2::text, 'Cancelamento da venda #' || $2::text)
       ORDER BY m.criado_em ASC, m.id ASC`,
      [empresaId, vendaId]
    );

    res.json({ ...venda, itens, movimentacoes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const { cliente_id, itens, desconto = 0, forma_pagamento, observacoes } = req.body;
  const client = await pool.connect();
  try {
    if (!Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'Adicione pelo menos um item para registrar a venda' });
    }

    await client.query('BEGIN');

    const itensNormalizados = [];
    let subtotal = 0;

    for (const item of itens) {
      const produtoId = Number(item.produto_id);
      const quantidade = toNumber(item.quantidade);
      const descontoItem = Math.max(0, toNumber(item.desconto || 0));

      if (!produtoId || !Number.isFinite(quantidade) || quantidade <= 0) {
        throw new Error('Item inválido: informe produto e quantidade maior que zero');
      }

      const { rows: [produto] } = await client.query(
        `SELECT id, nome, preco FROM produtos WHERE id = $1 AND empresa_id = $2 AND ativo = true`,
        [produtoId, empresaId]
      );

      if (!produto) {
        throw new Error(`Produto ${produtoId} não encontrado ou inativo`);
      }

      const { rows: [estoque] } = await client.query(
        `SELECT quantidade FROM estoque WHERE produto_id = $1 AND empresa_id = $2 FOR UPDATE`,
        [produtoId, empresaId]
      );

      const estoqueAtual = toNumber(estoque?.quantidade || 0);
      if (quantidade > estoqueAtual) {
        throw new Error(`Estoque insuficiente para ${produto.nome}. Disponível: ${estoqueAtual}`);
      }

      const precoUnitario = toNumber(produto.preco);
      const itemBruto = quantidade * precoUnitario;
      if (descontoItem > itemBruto) {
        throw new Error(`Desconto inválido no item ${produto.nome}`);
      }

      const itemTotal = itemBruto - descontoItem;
      subtotal += itemTotal;

      itensNormalizados.push({
        produto_id: produtoId,
        quantidade,
        preco_unitario: precoUnitario,
        desconto: descontoItem,
        total: itemTotal,
      });
    }

    const descontoVenda = Math.max(0, toNumber(desconto || 0));
    if (descontoVenda > subtotal) {
      throw new Error('Desconto total não pode ser maior que o subtotal da venda');
    }

    const total = subtotal - descontoVenda;

    const { rows: [venda] } = await client.query(
      `INSERT INTO vendas (empresa_id, cliente_id, usuario_id, subtotal, desconto, total, forma_pagamento, observacoes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'aberta') RETURNING *`,
      [empresaId, cliente_id, req.usuario.id, subtotal, descontoVenda, total, forma_pagamento, observacoes]
    );

    for (const item of itensNormalizados) {
      await client.query(
        `INSERT INTO itens_venda (empresa_id, venda_id, produto_id, quantidade, preco_unitario, desconto, total) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [empresaId, venda.id, item.produto_id, item.quantidade, item.preco_unitario, item.desconto, item.total]
      );
      await client.query(
        `UPDATE estoque SET quantidade = quantidade - $1, atualizado_em = NOW() WHERE produto_id = $2 AND empresa_id = $3`,
        [item.quantidade, item.produto_id, empresaId]
      );
      await client.query(
        `INSERT INTO movimentacoes_estoque (empresa_id, produto_id, tipo, quantidade, motivo, usuario_id) VALUES ($1,$2,'saida',$3,'Venda #' || $4,$5)`,
        [empresaId, item.produto_id, item.quantidade, venda.id, req.usuario.id]
      );
    }

    // Gera conta a receber automaticamente
    await client.query(
      `INSERT INTO contas (empresa_id, tipo, descricao, valor, vencimento, categoria, venda_id, cliente_id)
       VALUES ($1, 'receber', $2, $3, CURRENT_DATE + INTERVAL '30 days', 'Vendas', $4, $5)`,
      [empresaId, `Venda #${venda.id}`, total, venda.id, cliente_id]
    );

    await client.query('COMMIT');
    res.status(201).json(venda);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
}

async function atualizarStatus(req, res) {
  const client = await pool.connect();
  try {
    const novoStatus = req.body.status;
    const statusPermitidos = ['aberta', 'fechada', 'cancelada'];

    if (!statusPermitidos.includes(novoStatus)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    await client.query('BEGIN');

    const { rows: [venda] } = await client.query(
      'SELECT * FROM vendas WHERE id = $1 AND empresa_id = $2 FOR UPDATE',
      [req.params.id, req.empresaId]
    );

    if (!venda) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    if (venda.status === 'cancelada' && novoStatus !== 'cancelada') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Venda cancelada não pode mudar de status' });
    }

    if (novoStatus === 'cancelada' && venda.status !== 'cancelada') {
      const { rows: itens } = await client.query(
        'SELECT produto_id, quantidade FROM itens_venda WHERE venda_id = $1 AND empresa_id = $2',
        [req.params.id, req.empresaId]
      );

      for (const item of itens) {
        await client.query(
          `UPDATE estoque
           SET quantidade = quantidade + $1, atualizado_em = NOW()
           WHERE produto_id = $2 AND empresa_id = $3`,
          [item.quantidade, item.produto_id, req.empresaId]
        );

        await client.query(
          `INSERT INTO movimentacoes_estoque (empresa_id, produto_id, tipo, quantidade, motivo, usuario_id)
           VALUES ($1, $2, 'entrada', $3, 'Cancelamento da venda #' || $4, $5)`,
          [req.empresaId, item.produto_id, item.quantidade, req.params.id, req.usuario.id]
        );
      }

      await client.query(
        `UPDATE contas
         SET status = 'cancelado'
         WHERE empresa_id = $1 AND venda_id = $2 AND tipo = 'receber' AND status != 'pago'`,
        [req.empresaId, req.params.id]
      );
    }

    const { rows } = await client.query(
      'UPDATE vendas SET status = $1 WHERE id = $2 AND empresa_id = $3 RETURNING *',
      [novoStatus, req.params.id, req.empresaId]
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

module.exports = {
  listar,
  buscar,
  criar,
  atualizarStatus,
  relatorioResumo,
  relatorioPorProduto,
  relatorioPorPagamento,
};
