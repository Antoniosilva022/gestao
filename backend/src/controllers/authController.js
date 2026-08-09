const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

async function login(req, res) {
  const { email, senha, empresa_id = 1 } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND empresa_id = $2 AND ativo = true',
      [email, empresa_id]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciais inválidas' });

    const usuario = rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, empresa_id: usuario.empresa_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, empresa_id: usuario.empresa_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function me(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, perfil, empresa_id, criado_em FROM usuarios WHERE id = $1 AND empresa_id = $2',
      [req.usuario.id, req.empresaId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarUsuarios(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, perfil, ativo, empresa_id, criado_em FROM usuarios WHERE empresa_id = $1 ORDER BY nome',
      [req.empresaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criarUsuario(req, res) {
  const { nome, email, senha, perfil } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (empresa_id, nome, email, senha, perfil) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, perfil, empresa_id',
      [req.empresaId, nome, email, hash, perfil || 'operador']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function alterarSenha(req, res) {
  const { senhaAtual, novaSenha } = req.body;
  try {
    const { rows } = await pool.query('SELECT senha FROM usuarios WHERE id = $1 AND empresa_id = $2', [req.usuario.id, req.empresaId]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado' });
    const valida = await bcrypt.compare(senhaAtual, rows[0].senha);
    if (!valida) return res.status(400).json({ error: 'Senha atual incorreta' });

    const hash = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE usuarios SET senha = $1 WHERE id = $2 AND empresa_id = $3', [hash, req.usuario.id, req.empresaId]);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { login, me, listarUsuarios, criarUsuario, alterarSenha };
