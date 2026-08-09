const { pool } = require('../config/database');

async function obterDados(req, res) {
  try {
    const empresaId = req.empresaId;
    const [resumoVendas, vendasMes, topProdutos, contasResumo, estoqueAlerta, funcionariosStatus] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) as total_vendas,
          COALESCE(SUM(total), 0) as receita_total,
          COALESCE(SUM(CASE WHEN criado_em >= DATE_TRUNC('month', NOW()) THEN total ELSE 0 END), 0) as receita_mes,
          COUNT(CASE WHEN status = 'aberta' THEN 1 END) as vendas_abertas
        FROM vendas WHERE empresa_id = $1 AND status != 'cancelada'
      `, [empresaId]),
      pool.query(`
        SELECT TO_CHAR(criado_em, 'Mon/YY') as mes, SUM(total) as total
        FROM vendas WHERE empresa_id = $1 AND status != 'cancelada' AND criado_em >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', criado_em), TO_CHAR(criado_em, 'Mon/YY')
        ORDER BY DATE_TRUNC('month', criado_em)
      `, [empresaId]),
      pool.query(`
        SELECT p.nome, SUM(iv.quantidade) as quantidade_vendida, SUM(iv.total) as receita
        FROM itens_venda iv JOIN produtos p ON p.id = iv.produto_id
        JOIN vendas v ON v.id = iv.venda_id WHERE v.empresa_id = $1 AND iv.empresa_id = $1 AND p.empresa_id = $1 AND v.status != 'cancelada'
        GROUP BY p.id, p.nome ORDER BY receita DESC LIMIT 5
      `, [empresaId]),
      pool.query(`
        SELECT
          SUM(CASE WHEN tipo='receber' AND status='pendente' THEN valor ELSE 0 END) as total_receber,
          SUM(CASE WHEN tipo='pagar' AND status='pendente' THEN valor ELSE 0 END) as total_pagar,
          COUNT(CASE WHEN status='vencido' THEN 1 END) as contas_vencidas
        FROM contas WHERE empresa_id = $1
      `, [empresaId]),
      pool.query(`SELECT COUNT(*) as count FROM estoque e JOIN produtos p ON p.id = e.produto_id WHERE e.empresa_id = $1 AND p.empresa_id = $1 AND e.quantidade <= e.quantidade_minima AND p.ativo = true`, [empresaId]),
      pool.query(`SELECT status, COUNT(*) as count FROM funcionarios WHERE empresa_id = $1 GROUP BY status`, [empresaId]),
    ]);

    res.json({
      resumo: resumoVendas.rows[0],
      vendas_por_mes: vendasMes.rows,
      top_produtos: topProdutos.rows,
      financeiro: contasResumo.rows[0],
      estoque_alerta: parseInt(estoqueAlerta.rows[0].count),
      funcionarios: funcionariosStatus.rows,
      total_clientes: (await pool.query('SELECT COUNT(*) FROM clientes WHERE empresa_id = $1 AND ativo = true', [empresaId])).rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { obterDados };
