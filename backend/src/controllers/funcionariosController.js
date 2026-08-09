const { pool } = require('../config/database');

async function listar(req, res) {
  try {
    const empresaId = req.empresaId;
    const { search = '', status, salario_min, salario_max, admissao_inicio, admissao_fim } = req.query;
    let query = `SELECT * FROM funcionarios WHERE empresa_id = $1 AND (nome ILIKE $2 OR cargo ILIKE $2 OR departamento ILIKE $2)`;
    const params = [empresaId, `%${search}%`];
    if (status) { params.push(status); query += ` AND status = $${params.length}`; }
    if (salario_min) { params.push(salario_min); query += ` AND COALESCE(salario, 0) >= $${params.length}`; }
    if (salario_max) { params.push(salario_max); query += ` AND COALESCE(salario, 0) <= $${params.length}`; }
    if (admissao_inicio) { params.push(admissao_inicio); query += ` AND data_admissao >= $${params.length}`; }
    if (admissao_fim) { params.push(admissao_fim); query += ` AND data_admissao <= $${params.length}`; }
    query += ' ORDER BY nome';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscar(req, res) {
  try {
    const { rows } = await pool.query('SELECT * FROM funcionarios WHERE id = $1 AND empresa_id = $2', [req.params.id, req.empresaId]);
    if (!rows.length) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  const empresaId = req.empresaId;
  const { nome, email, cpf, telefone, cargo, departamento, salario, data_admissao } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO funcionarios (empresa_id, nome, email, cpf, telefone, cargo, departamento, salario, data_admissao)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [empresaId, nome, email, cpf, telefone, cargo, departamento, salario, data_admissao]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function atualizar(req, res) {
  const empresaId = req.empresaId;
  const { nome, email, cpf, telefone, cargo, departamento, salario, data_admissao, data_demissao, status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE funcionarios SET nome=$1, email=$2, cpf=$3, telefone=$4, cargo=$5, departamento=$6, salario=$7, data_admissao=$8, data_demissao=$9, status=$10
       WHERE id=$11 AND empresa_id = $12 RETURNING *`,
      [nome, email, cpf, telefone, cargo, departamento, salario, data_admissao, data_demissao, status, req.params.id, empresaId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Funcionário não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { listar, buscar, criar, atualizar };
