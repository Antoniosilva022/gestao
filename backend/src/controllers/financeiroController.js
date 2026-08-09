const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { tipo, status, data_inicio, data_fim } = req.query;
    let query = `SELECT c.*, cl.nome as cliente_nome FROM contas c LEFT JOIN clientes cl ON cl.id = c.cliente_id AND cl.empresa_id = c.empresa_id WHERE c.empresa_id = $1`;
    const params = [empresaId];
    if (tipo) { params.push(tipo); query += ` AND c.tipo = $${params.length}`; }
    if (status) { params.push(status); query += ` AND c.status = $${params.length}`; }
    if (data_inicio) { params.push(data_inicio); query += ` AND c.vencimento >= $${params.length}`; }
    if (data_fim) { params.push(data_fim); query += ` AND c.vencimento <= $${params.length}`; }
    query += ' ORDER BY c.vencimento';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const { tipo, descricao, valor, vencimento, categoria, cliente_id, funcionario_id, observacoes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO contas (empresa_id, tipo, descricao, valor, vencimento, categoria, cliente_id, funcionario_id, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [empresaId, tipo, descricao, valor, vencimento, categoria, cliente_id, funcionario_id, observacoes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function pagar(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE contas SET status = 'pago', pagamento = CURRENT_DATE WHERE id = $1 AND empresa_id = $2 RETURNING *`,
      [req.params.id, req.empresaId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function cancelar(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE contas SET status = 'cancelado' WHERE id = $1 AND empresa_id = $2 RETURNING *`,
      [req.params.id, req.empresaId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Conta não encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function resumo(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        SUM(CASE WHEN tipo='receber' AND status='pendente' THEN valor ELSE 0 END) as total_receber,
        SUM(CASE WHEN tipo='pagar' AND status='pendente' THEN valor ELSE 0 END) as total_pagar,
        SUM(CASE WHEN tipo='receber' AND status='pago' AND pagamento >= DATE_TRUNC('month', NOW()) THEN valor ELSE 0 END) as recebido_mes,
        SUM(CASE WHEN tipo='pagar' AND status='pago' AND pagamento >= DATE_TRUNC('month', NOW()) THEN valor ELSE 0 END) as pago_mes
      FROM contas
      WHERE empresa_id = $1
    `, [req.empresaId]);
    // Atualiza contas vencidas
    await pool.query(`UPDATE contas SET status = 'vencido' WHERE empresa_id = $1 AND status = 'pendente' AND vencimento < CURRENT_DATE`, [req.empresaId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, criar, pagar, cancelar, resumo };
