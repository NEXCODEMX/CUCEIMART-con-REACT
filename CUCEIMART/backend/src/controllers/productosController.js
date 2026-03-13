// src/controllers/productosController.js
// CUCEI MART - Controlador de productos | NEXCODE

const { query } = require('../db/connection');

// ─── LISTAR PRODUCTOS (con filtros) ─────────────────────────────────────────
const listarProductos = async (req, res) => {
  const {
    busqueda = '',
    categoria = '',
    precio_min = 0,
    precio_max = 999999,
    orden = 'destacados',
    pagina = 1,
    limite = 16,
    id_emprendedor = '',
  } = req.query;

  const offset = (parseInt(pagina) - 1) * parseInt(limite);
  const params = [];
  let condiciones = [`p.estado = 'activo'`, `p.disponible = TRUE`];

  if (busqueda.trim()) {
    params.push(`%${busqueda.trim()}%`);
    condiciones.push(`(p.nombre ILIKE $${params.length} OR p.descripcion_corta ILIKE $${params.length})`);
  }

  if (categoria && categoria !== 'todos') {
    params.push(categoria);
    condiciones.push(`($${params.length}::cuceimart.categoria_negocio = ANY(p.categorias))`);
  }

  params.push(parseFloat(precio_min));
  condiciones.push(`p.precio >= $${params.length}`);
  params.push(parseFloat(precio_max));
  condiciones.push(`p.precio <= $${params.length}`);

  if (id_emprendedor) {
    params.push(id_emprendedor);
    condiciones.push(`p.id_emprendedor = $${params.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  let orderBy = 'p.es_destacado DESC, p.total_vendido DESC';
  if (orden === 'precio_asc')  orderBy = 'p.precio ASC';
  if (orden === 'precio_desc') orderBy = 'p.precio DESC';
  if (orden === 'recientes')   orderBy = 'p.creado_en DESC';
  if (orden === 'calificacion') orderBy = 'p.calificacion_prom DESC';

  params.push(parseInt(limite), offset);

  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM cuceimart.productos p ${where}`,
      params.slice(0, params.length - 2)
    );

    const result = await query(
      `SELECT
         p.id_producto, p.nombre, p.descripcion_corta,
         p.precio, p.precio_anterior, p.precio_texto,
         p.tiene_descuento, p.porcentaje_descuento,
         p.categoria_principal, p.es_destacado,
         p.total_vendido, p.calificacion_prom, p.total_resenas,
         p.slug, p.disponible,
         e.nombre_negocio, e.slug_negocio AS slug_emprendedor,
         e.reputacion_promedio AS reputacion_emprendedor,
         e.nivel_membresia
       FROM cuceimart.productos p
       INNER JOIN cuceimart.emprendedores e ON e.id_emprendedor = p.id_emprendedor
         AND e.estado = 'activa' AND e.estado_verificacion = 'aprobado'
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
    console.error('[Productos] Error listar:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── MIS PRODUCTOS (para el emprendedor autenticado) ─────────────────────────
const misProductos = async (req, res) => {
  const id_emprendedor = req.user.id;

  try {
    const result = await query(
      `SELECT id_producto, nombre, descripcion_corta, precio, precio_texto,
              categoria_principal, estado, disponible, es_destacado,
              total_vendido, calificacion_prom, total_resenas, slug, creado_en
       FROM cuceimart.productos
       WHERE id_emprendedor = $1
       ORDER BY es_destacado DESC, creado_en DESC`,
      [id_emprendedor]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Productos] Error misProductos:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

// ─── CREAR PRODUCTO ──────────────────────────────────────────────────────────
const crearProducto = async (req, res) => {
  const id_emprendedor = req.user.id;
  const {
    nombre, descripcion, descripcion_corta, precio,
    precio_texto, categoria_principal, disponible,
  } = req.body;

  if (!nombre || !precio || !categoria_principal) {
    return res.status(400).json({ success: false, message: 'Nombre, precio y categoria son requeridos.' });
  }

  const slug = `${nombre.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')}-${Date.now()}`;

  try {
    const result = await query(
      `INSERT INTO cuceimart.productos
         (id_emprendedor, nombre, descripcion, descripcion_corta,
          precio, precio_texto, categorias, categoria_principal,
          disponible, slug, estado)
       VALUES ($1,$2,$3,$4,$5,$6,
               ARRAY[$7]::cuceimart.categoria_negocio[],
               $7::cuceimart.categoria_negocio,
               $8,$9,'activo')
       RETURNING id_producto, nombre, precio, slug, estado`,
      [
        id_emprendedor, nombre, descripcion || null,
        descripcion_corta || null, parseFloat(precio),
        precio_texto || null, categoria_principal,
        disponible !== false, slug,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      data: result.rows[0],
    });
  } catch (err) {
    console.error('[Productos] Error crear:', err.message);
    return res.status(500).json({ success: false, message: 'Error del servidor.' });
  }
};

module.exports = { listarProductos, misProductos, crearProducto };
