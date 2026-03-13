// src/middleware/auth.js
// CUCEI MART - Middleware de autenticacion JWT | NEXCODE

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cuceimart_jwt_secret_super_seguro_2025_nexcode';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acceso denegado. Token requerido.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Token invalido o expirado.',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado.' });
    }
    if (!roles.includes(req.user.tipo)) {
      return res.status(403).json({
        success: false,
        message: 'Sin permisos para esta accion.',
      });
    }
    next();
  };
};

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { authenticateToken, requireRole, generateToken };
