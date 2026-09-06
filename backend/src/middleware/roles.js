function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.perfil)) {
      return res.status(403).json({ error: 'Acesso não permitido para este perfil' });
    }
    next();
  };
}

module.exports = { allowRoles };
