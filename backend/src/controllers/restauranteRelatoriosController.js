const { pool } = require('../config/database');

async function faturamentoDiario(req, res) {
  try {
    const empresaId = req.empresaId;
    const { data_inicio, data_fim } = req.query;
    const params = [empresaId];
    let where = "WHERE p.empresa_id = $1 AND p.status IN ('entregue', 'fechado')";

    if (data_inicio) {
      params.push(data_inicio);
      where += ` AND DATE(p.criado_em) >= $${params.length}`;
    }

    if (data_fim) {
      params.push(data_fim);
      where += ` AND DATE(p.criado_em) <= $${params.length}`;
    }

    const { rows } = await pool.query(
      `SELECT
         DATE(p.criado_em) AS dia,
         COUNT(DISTINCT p.id) AS pedidos,
         COALESCE(SUM(ip.subtotal), 0)::numeric(12,2) AS subtotal,
         COALESCE(SUM(ip.subtotal * (p.taxa_servico_pct / 100.0)), 0)::numeric(12,2) AS taxa_servico,
         COALESCE(SUM(p.desconto_valor), 0)::numeric(12,2) AS descontos,
         (
           COALESCE(SUM(ip.subtotal), 0)
           + COALESCE(SUM(ip.subtotal * (p.taxa_servico_pct / 100.0)), 0)
           - COALESCE(SUM(p.desconto_valor), 0)
         )::numeric(12,2) AS total_liquido
       FROM pedidos p
       LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
       ${where}
       GROUP BY DATE(p.criado_em)
       ORDER BY dia DESC`,
      params
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function produtosMaisVendidos(req, res) {
  try {
    const empresaId = req.empresaId;
    const limite = Math.min(Number(req.query.limite || 10), 100);

    const { rows } = await pool.query(
      `SELECT
         pr.id,
         pr.nome,
         SUM(ip.quantidade)::numeric(12,3) AS quantidade_vendida,
         SUM(ip.subtotal)::numeric(12,2) AS faturamento
       FROM itens_pedido ip
       JOIN produtos pr ON pr.id = ip.produto_id
       JOIN pedidos p ON p.id = ip.pedido_id
       WHERE p.empresa_id = $1 AND p.status IN ('entregue', 'fechado')
       GROUP BY pr.id, pr.nome
       ORDER BY quantidade_vendida DESC
       LIMIT $2`,
      [empresaId, limite]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function ticketMedio(req, res) {
  try {
    const empresaId = req.empresaId;
    const { rows } = await pool.query(
      `WITH totais AS (
         SELECT
           p.id,
           (
             COALESCE(SUM(ip.subtotal), 0)
             + COALESCE(SUM(ip.subtotal * (p.taxa_servico_pct / 100.0)), 0)
             - COALESCE(MAX(p.desconto_valor), 0)
           )::numeric(12,2) AS total_pedido
         FROM pedidos p
         LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
         WHERE p.empresa_id = $1 AND p.status IN ('entregue', 'fechado')
         GROUP BY p.id
       )
       SELECT
         COUNT(*)::int AS pedidos,
         COALESCE(SUM(total_pedido), 0)::numeric(12,2) AS faturamento_total,
         COALESCE(AVG(total_pedido), 0)::numeric(12,2) AS ticket_medio
       FROM totais`,
      [empresaId]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { faturamentoDiario, produtosMaisVendidos, ticketMedio };
