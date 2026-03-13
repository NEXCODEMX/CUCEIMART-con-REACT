// server.js
// CUCEI MART - Servidor principal Express | NEXCODE
// =============================================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const routes = require('./src/routes/index');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── SEGURIDAD ───────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origen no permitido.'));
    }
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message: { success: false, message: 'Demasiadas solicitudes. Intenta mas tarde.' },
  standardHeaders: true,
  legacyHeaders:   false,
});
app.use(limiter);

// ─── PARSING ─────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── LOGGING BASICO ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ─── RUTAS ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── ROOT ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    proyecto: 'CUCEI MART',
    desarrollado_por: 'NEXCODE',
    version: '1.0.0',
    api: '/api/v1',
    docs: 'Ver README.md para documentacion completa',
  });
});

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada.' });
});

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Server] Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor.',
  });
});

// ─── INICIO ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║        CUCEI MART API - NEXCODE           ║
  ║   Servidor corriendo en puerto ${PORT}      ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}              ║
  ║   API: http://localhost:${PORT}/api/v1    ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
