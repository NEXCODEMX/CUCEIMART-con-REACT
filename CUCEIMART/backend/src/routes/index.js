// src/routes/index.js
// CUCEI MART - Rutas principales | NEXCODE

const express = require('express');
const router = express.Router();

const {
  loginCliente, loginEmprendedor,
  registrarCliente, registrarEmprendedor,
  verificarToken,
} = require('../controllers/authController');

const {
  listarEmprendedores, obtenerEmprendedor,
  listarDestacados, crearResena, miPerfil,
} = require('../controllers/emprendedoresController');

const {
  listarProductos, misProductos, crearProducto,
} = require('../controllers/productosController');

const { authenticateToken, requireRole } = require('../middleware/auth');

// ─── AUTH ────────────────────────────────────────────────────────────────────
router.post('/auth/login/cliente',        loginCliente);
router.post('/auth/login/emprendedor',    loginEmprendedor);
router.post('/auth/registro/cliente',     registrarCliente);
router.post('/auth/registro/emprendedor', registrarEmprendedor);
router.get( '/auth/verificar',            authenticateToken, verificarToken);

// ─── EMPRENDEDORES (publico) ─────────────────────────────────────────────────
router.get('/emprendedores',             listarEmprendedores);
router.get('/emprendedores/destacados',  listarDestacados);
router.get('/emprendedores/:slug',       obtenerEmprendedor);

// ─── RESEÑAS (requiere autenticacion de cliente) ─────────────────────────────
router.post(
  '/emprendedores/:id_emprendedor/resenas',
  authenticateToken,
  requireRole('cliente'),
  crearResena
);

// ─── PRODUCTOS (publico) ─────────────────────────────────────────────────────
router.get('/productos', listarProductos);

// ─── PANEL EMPRENDEDOR (requiere autenticacion) ──────────────────────────────
router.get('/emprendedor/perfil',    authenticateToken, requireRole('emprendedor'), miPerfil);
router.get('/emprendedor/productos', authenticateToken, requireRole('emprendedor'), misProductos);
router.post('/emprendedor/productos',authenticateToken, requireRole('emprendedor'), crearProducto);

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'CUCEI MART API funcionando.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
