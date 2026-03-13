// src/controllers/authController.js
// CUCEI MART - Controlador de autenticacion | NEXCODE

const bcrypt = require('bcryptjs');
const { query } = require('../db/connection');
const { generateToken } = require('../middleware/auth');

// ─── LOGIN CLIENTE ──────────────────────────────────────────────────────────
const loginCliente = async (req, res) => {
  const { identificador, contrasena } = req.body;

  if (!identificador || !contrasena) {
    return res.status(400).json({ success: false, message: 'Campos requeridos.' });
  }

  try {
    const result = await query(
      `SELECT id_cliente, nombre, apellido_paterno, nombre_usuario,
              correo_udg, codigo_alumno, contrasena_hash, estado,
              correo_verificado, avatar_url, carrera, semestre
       FROM cuceimart.clientes
       WHERE nombre_usuario = $1 OR correo_udg = $1`,
      [identificador.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    const cliente = result.rows[0];

    if (cliente.estado !== 'activa') {
      return res.status(403).json({
        success: false,
        message: `Cuenta ${cliente.estado}. Contacta soporte.`,
      });
    }

    const esValido = await bcrypt.compare(contrasena, cliente.contrasena_hash);
    if (!esValido) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    await query(
      `UPDATE cuceimart.clientes SET ultimo_acceso = NOW() WHERE id_cliente = $1`,
      [cliente.id_cliente]
    );

    const token = generateToken({
      id: cliente.id_cliente,
      tipo: 'cliente',
      nombre_usuario: cliente.nombre_usuario,
    });

    const { contrasena_hash, ...clienteSeguro } = cliente;

    return res.json({
      success: true,
      message: 'Bienvenido a CUCEI MART.',
      token,
      user: { ...clienteSeguro, tipo: 'cliente' },
    });
  } catch (err) {
    console.error('[Auth] Error login cliente:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── LOGIN EMPRENDEDOR ───────────────────────────────────────────────────────
const loginEmprendedor = async (req, res) => {
  const { identificador, contrasena } = req.body;

  if (!identificador || !contrasena) {
    return res.status(400).json({ success: false, message: 'Campos requeridos.' });
  }

  try {
    const result = await query(
      `SELECT id_emprendedor, nombre, apellido_paterno, nombre_usuario,
              correo_contacto, nombre_negocio, slug_negocio, contrasena_hash,
              estado, estado_verificacion, reputacion_promedio, total_resenas,
              total_productos, nivel_membresia, es_destacado, categoria_principal
       FROM cuceimart.emprendedores
       WHERE nombre_usuario = $1 OR correo_contacto = $1`,
      [identificador.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    const emp = result.rows[0];

    if (emp.estado !== 'activa') {
      return res.status(403).json({
        success: false,
        message: `Cuenta ${emp.estado}. Contacta soporte.`,
      });
    }

    const esValido = await bcrypt.compare(contrasena, emp.contrasena_hash);
    if (!esValido) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas.' });
    }

    await query(
      `UPDATE cuceimart.emprendedores SET ultimo_acceso = NOW() WHERE id_emprendedor = $1`,
      [emp.id_emprendedor]
    );

    const token = generateToken({
      id: emp.id_emprendedor,
      tipo: 'emprendedor',
      nombre_usuario: emp.nombre_usuario,
      slug: emp.slug_negocio,
    });

    const { contrasena_hash, ...empSeguro } = emp;

    return res.json({
      success: true,
      message: `Bienvenido, ${emp.nombre_negocio}.`,
      token,
      user: { ...empSeguro, tipo: 'emprendedor' },
    });
  } catch (err) {
    console.error('[Auth] Error login emprendedor:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── REGISTRO CLIENTE ────────────────────────────────────────────────────────
const registrarCliente = async (req, res) => {
  const {
    codigo_alumno, correo_udg, nombre,
    apellido_paterno, apellido_materno,
    nombre_usuario, contrasena, carrera, semestre,
  } = req.body;

  if (!codigo_alumno || !correo_udg || !nombre || !apellido_paterno || !nombre_usuario || !contrasena) {
    return res.status(400).json({ success: false, message: 'Todos los campos obligatorios son requeridos.' });
  }

  if (!correo_udg.endsWith('@alumnos.udg.mx')) {
    return res.status(400).json({ success: false, message: 'Debes usar tu correo @alumnos.udg.mx.' });
  }

  if (contrasena.length < 8) {
    return res.status(400).json({ success: false, message: 'La contrasena debe tener minimo 8 caracteres.' });
  }

  try {
    const existe = await query(
      `SELECT id_cliente FROM cuceimart.clientes
       WHERE codigo_alumno = $1 OR correo_udg = $2 OR nombre_usuario = $3`,
      [codigo_alumno, correo_udg.toLowerCase(), nombre_usuario.toLowerCase()]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con esos datos.' });
    }

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(contrasena, salt);

    const result = await query(
      `INSERT INTO cuceimart.clientes
         (codigo_alumno, correo_udg, nombre, apellido_paterno, apellido_materno,
          nombre_usuario, contrasena_hash, salt, estado, correo_verificado,
          carrera, semestre)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'activa',true,$9,$10)
       RETURNING id_cliente, nombre, apellido_paterno, nombre_usuario,
                 correo_udg, codigo_alumno, carrera, semestre, estado`,
      [
        codigo_alumno, correo_udg.toLowerCase(), nombre, apellido_paterno,
        apellido_materno || null, nombre_usuario.toLowerCase(), hash, salt,
        carrera || null, semestre ? parseInt(semestre) : null,
      ]
    );

    const cliente = result.rows[0];
    const token = generateToken({ id: cliente.id_cliente, tipo: 'cliente', nombre_usuario: cliente.nombre_usuario });

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente. Bienvenido a CUCEI MART.',
      token,
      user: { ...cliente, tipo: 'cliente' },
    });
  } catch (err) {
    console.error('[Auth] Error registro cliente:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── REGISTRO EMPRENDEDOR ────────────────────────────────────────────────────
const registrarEmprendedor = async (req, res) => {
  const {
    correo_contacto, nombre, apellido_paterno, nombre_usuario,
    contrasena, nombre_negocio, descripcion_corta, categoria_principal,
    whatsapp, instagram, codigo_alumno,
  } = req.body;

  if (!correo_contacto || !nombre || !apellido_paterno || !nombre_usuario ||
      !contrasena || !nombre_negocio || !categoria_principal) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes.' });
  }

  if (contrasena.length < 8) {
    return res.status(400).json({ success: false, message: 'La contrasena debe tener minimo 8 caracteres.' });
  }

  try {
    const existe = await query(
      `SELECT id_emprendedor FROM cuceimart.emprendedores
       WHERE correo_contacto = $1 OR nombre_usuario = $2`,
      [correo_contacto.toLowerCase(), nombre_usuario.toLowerCase()]
    );

    if (existe.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese correo o usuario.' });
    }

    const slug = nombre_negocio
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const slugExiste = await query(
      `SELECT id_emprendedor FROM cuceimart.emprendedores WHERE slug_negocio = $1`,
      [slug]
    );
    const slugFinal = slugExiste.rows.length > 0 ? `${slug}-${Date.now()}` : slug;

    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(contrasena, salt);

    const result = await query(
      `INSERT INTO cuceimart.emprendedores
         (codigo_alumno, correo_contacto, nombre, apellido_paterno, nombre_usuario,
          contrasena_hash, salt, nombre_negocio, slug_negocio, descripcion_corta,
          categorias, categoria_principal, whatsapp, instagram,
          estado, estado_verificacion, correo_verificado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
               ARRAY[$11]::cuceimart.categoria_negocio[],
               $11::cuceimart.categoria_negocio,
               $12,$13,'activa','aprobado',true)
       RETURNING id_emprendedor, nombre, nombre_usuario, nombre_negocio,
                 slug_negocio, correo_contacto, categoria_principal, estado`,
      [
        codigo_alumno || null, correo_contacto.toLowerCase(), nombre, apellido_paterno,
        nombre_usuario.toLowerCase(), hash, salt, nombre_negocio, slugFinal,
        descripcion_corta || null, categoria_principal,
        whatsapp || null, instagram || null,
      ]
    );

    const emp = result.rows[0];
    const token = generateToken({ id: emp.id_emprendedor, tipo: 'emprendedor', nombre_usuario: emp.nombre_usuario, slug: emp.slug_negocio });

    return res.status(201).json({
      success: true,
      message: 'Emprendimiento registrado. Bienvenido a CUCEI MART.',
      token,
      user: { ...emp, tipo: 'emprendedor' },
    });
  } catch (err) {
    console.error('[Auth] Error registro emprendedor:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── VERIFICAR TOKEN ─────────────────────────────────────────────────────────
const verificarToken = async (req, res) => {
  return res.json({ success: true, user: req.user });
};

module.exports = { loginCliente, loginEmprendedor, registrarCliente, registrarEmprendedor, verificarToken };
