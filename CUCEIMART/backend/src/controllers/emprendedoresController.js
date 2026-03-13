// src/controllers/emprendedoresController.js
// CUCEI MART - Controlador de emprendedores | NEXCODE

const { query } = require('../db/connection');

// ─── LISTAR EMPRENDEDORES (con filtros y búsqueda) ──────────────────────────
const listarEmprendedores = async (req, res) => {
  const {
    busqueda = '',
    categoria = '',
    orden = 'reputacion',
    pagina = 1,
    limite = 12,
    solo_destacados = false,
  } = req.query;

  const offset = (parseInt(pagina) - 1) * parseInt(limite);
  const params = [];
  let condiciones = [`e.estado = 'activa'`, `e.estado_verificacion = 'aprobado'`];

  if (busqueda.trim()) {
    params.push(`%${busqueda.trim()}%`);
    condiciones.push(
      `(e.nombre_negocio ILIKE $${params.length} OR e.descripcion_corta ILIKE $${params.length})`
    );
  }

  if (categoria && categoria !== 'todos') {
    params.push(categoria);
    condiciones.push(`($${params.length}::cuceimart.categoria_negocio = ANY(e.categorias))`);
  }

  if (solo_destacados === 'true') {
    condiciones.push(`e.es_destacado = TRUE`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  let orderBy = 'e.reputacion_promedio DESC, e.total_resenas DESC';
  if (orden === 'nombre')    orderBy = 'e.nombre_negocio ASC';
  if (orden === 'recientes') orderBy = 'e.creado_en DESC';
  if (orden === 'productos') orderBy = 'e.total_productos DESC';

  params.push(parseInt(limite), offset);

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM cuceimart.emprendedores e ${where}`,
      params.slice(0, params.length - 2)
    );

    const result = await query(
      `SELECT
         e.id_emprendedor, e.nombre_negocio, e.slug_negocio,
         e.descripcion_corta, e.categoria_principal, e.categorias,
         e.reputacion_promedio, e.total_resenas, e.total_productos,
         e.es_destacado, e.nivel_membresia, e.precio_minimo,
         e.precio_maximo, e.precio_texto, e.whatsapp, e.instagram,
         e.website_externo, e.edificio_id, e.zona_id
       FROM cuceimart.emprendedores e
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      pagina: parseInt(pagina),
      limite: parseInt(limite),
    });
  } catch (err) {
    console.error('[Emprendedores] Error listar:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── OBTENER EMPRENDEDOR POR SLUG ────────────────────────────────────────────
const obtenerEmprendedor = async (req, res) => {
  const { slug } = req.params;

  try {
    const result = await query(
      `SELECT
         e.id_emprendedor, e.nombre_negocio, e.slug_negocio,
         e.descripcion_corta, e.descripcion_larga,
         e.categoria_principal, e.categorias,
         e.reputacion_promedio, e.total_resenas, e.total_productos,
         e.es_destacado, e.nivel_membresia,
         e.precio_minimo, e.precio_maximo, e.precio_texto,
         e.whatsapp, e.instagram, e.facebook, e.tiktok,
         e.website_externo, e.telefono,
         e.edificio_id, e.zona_id, e.mapa_x, e.mapa_y,
         e.creado_en, e.num_verificacion
       FROM cuceimart.emprendedores e
       WHERE e.slug_negocio = $1
         AND e.estado = 'activa'
         AND e.estado_verificacion = 'aprobado'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Emprendimiento no encontrado.' });
    }

    const emprendedor = result.rows[0];

    // Productos del emprendedor
    const productos = await query(
      `SELECT id_producto, nombre, descripcion_corta, precio, precio_texto,
              categoria_principal, es_destacado, disponible, total_vendido,
              calificacion_prom, total_resenas, slug
       FROM cuceimart.productos
       WHERE id_emprendedor = $1 AND estado = 'activo'
       ORDER BY es_destacado DESC, total_vendido DESC`,
      [emprendedor.id_emprendedor]
    );

    // Reseñas publicas
    const resenas = await query(
      `SELECT r.id_resena, r.calificacion, r.titulo, r.comentario,
              r.total_utiles, r.creado_en, r.editado,
              c.nombre_usuario AS autor_usuario, c.avatar_url AS autor_avatar,
              rr.respuesta AS respuesta_emprendedor
       FROM cuceimart.resenas r
       INNER JOIN cuceimart.clientes c ON c.id_cliente = r.id_cliente
       LEFT JOIN cuceimart.respuestas_resenas rr ON rr.id_resena = r.id_resena
       WHERE r.id_emprendedor = $1 AND r.aprobado = TRUE
       ORDER BY r.total_utiles DESC, r.creado_en DESC
       LIMIT 10`,
      [emprendedor.id_emprendedor]
    );

    return res.json({
      success: true,
      data: {
        ...emprendedor,
        productos: productos.rows,
        resenas: resenas.rows,
      },
    });
  } catch (err) {
    console.error('[Emprendedores] Error obtener:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── EMPRENDEDORES DESTACADOS (BANNER) ──────────────────────────────────────
const listarDestacados = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         e.id_emprendedor, e.nombre_negocio, e.slug_negocio,
         e.descripcion_corta, e.reputacion_promedio, e.total_resenas,
         e.categoria_principal, e.nivel_membresia,
         e.precio_texto, e.instagram, e.whatsapp,
         ed.titulo_promocional, ed.descripcion_promo,
         ed.posicion_banner, ed.url_destino
       FROM cuceimart.emprendedores_destacados ed
       INNER JOIN cuceimart.emprendedores e
         ON e.id_emprendedor = ed.id_emprendedor
       WHERE ed.activo = TRUE
         AND (ed.fecha_fin IS NULL OR ed.fecha_fin >= CURRENT_DATE)
         AND e.estado = 'activa'
         AND e.estado_verificacion = 'aprobado'
       ORDER BY ed.posicion_banner ASC
       LIMIT 6`
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Destacados] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── CREAR RESEÑA ────────────────────────────────────────────────────────────
const crearResena = async (req, res) => {
  const { id_emprendedor } = req.params;
  const { calificacion, titulo, comentario, id_producto } = req.body;
  const id_cliente = req.user.id;

  if (!calificacion || !comentario) {
    return res.status(400).json({ success: false, message: 'Calificacion y comentario son requeridos.' });
  }

  if (calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ success: false, message: 'Calificacion debe ser entre 1 y 5.' });
  }

  if (comentario.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'El comentario debe tener al menos 10 caracteres.' });
  }

  try {
    const yaExiste = await query(
      `SELECT id_resena FROM cuceimart.resenas
       WHERE id_cliente = $1 AND id_emprendedor = $2`,
      [id_cliente, id_emprendedor]
    );

    if (yaExiste.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Ya enviaste una resena para este emprendimiento.' });
    }

    await query(
      `INSERT INTO cuceimart.resenas
         (id_cliente, id_emprendedor, id_producto, calificacion, titulo, comentario, aprobado)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
      [id_cliente, id_emprendedor, id_producto || null, parseInt(calificacion), titulo || null, comentario.trim()]
    );

    return res.status(201).json({ success: true, message: 'Resena publicada exitosamente.' });
  } catch (err) {
    console.error('[Resena] Error crear:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── MI PERFIL DE EMPRENDEDOR ────────────────────────────────────────────────
const miPerfil = async (req, res) => {
  const id_emprendedor = req.user.id;

  try {
    const result = await query(
      `SELECT
         id_emprendedor, nombre, apellido_paterno, nombre_usuario,
         correo_contacto, nombre_negocio, slug_negocio, descripcion_corta,
         descripcion_larga, categoria_principal, categorias, whatsapp,
         instagram, facebook, tiktok, website_externo, telefono,
         edificio_id, zona_id, nivel_membresia, es_destacado,
         reputacion_promedio, total_resenas, total_productos,
         precio_minimo, precio_maximo, precio_texto, estado,
         estado_verificacion, num_verificacion, creado_en
       FROM cuceimart.emprendedores
       WHERE id_emprendedor = $1`,
      [id_emprendedor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[MiPerfil] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

module.exports = { listarEmprendedores, obtenerEmprendedor, listarDestacados, crearResena, miPerfil };
