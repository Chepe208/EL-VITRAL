const { query } = require('../../lib/db.js');
const { requireAdmin, sanitizeString } = require('../../lib/auth.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');

async function getProductList(activeOnly = true) {
  const sql = activeOnly
    ? 'SELECT * FROM productos WHERE activo = 1 ORDER BY id ASC'
    : 'SELECT * FROM productos ORDER BY id ASC';
  const rows = await query(sql);
  return Array.isArray(rows) ? rows.map(formatNumericRow) : [];
}

async function getPublicProductList() {
  const sql = `
    SELECT id, nombre, tipo, descripcion, imagen_url, unidad_medida, precio_base
    FROM productos
    WHERE activo = 1 AND stock > 0
    ORDER BY id ASC
  `;
  const rows = await query(sql);
  return Array.isArray(rows) ? rows.map(formatNumericRow) : [];
}

async function getActiveProducts(req, res) {
  const productos = await getProductList(true);
  return sendJSON(res, 200, productos);
}

async function getPublicProducts(req, res) {
  const productos = await getPublicProductList();
  return sendJSON(res, 200, productos);
}

async function getAdminProducts(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const productos = await getProductList(false);
  return sendJSON(res, 200, productos);
}

async function createProduct(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  const body = await parseBody(req);
  const nombre = sanitizeString(body.nombre || '');
  const descripcion = sanitizeString(body.descripcion || '');
  const tipo = sanitizeString(body.tipo || '');
  const unidad_medida = sanitizeString(body.unidad_medida || '');
  const precio_base = Number(body.precio_base);
  const imagen_url = sanitizeString(body.imagen_url || '');
  const stock = Number(body.stock);
  const activo = body.activo === false ? 0 : 1;

  if (!nombre || !tipo || !unidad_medida) {
    return sendJSON(res, 400, { error: 'Faltan campos requeridos para crear el producto' });
  }
  if (Number.isNaN(precio_base) || precio_base <= 0) {
    return sendJSON(res, 400, { error: 'El precio debe ser un número mayor a cero' });
  }
  if (Number.isNaN(stock) || stock < 0) {
    return sendJSON(res, 400, { error: 'El stock debe ser un número mayor o igual a cero' });
  }

  const result = await query(
    'INSERT INTO productos (nombre, descripcion, tipo, unidad_medida, precio_base, imagen_url, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [nombre, descripcion || null, tipo, unidad_medida, precio_base, imagen_url || null, stock, activo]
  );

  return sendJSON(res, 201, { message: 'Producto creado', id: result.insertId });
}

async function updateProduct(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) {
    return sendJSON(res, 400, { error: 'ID de producto inválido' });
  }

  try {
    const existing = await query('SELECT id FROM productos WHERE id = ?', [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return sendJSON(res, 404, { error: 'Producto no encontrado' });
    }

    const body = await parseBody(req);
    const rawPrecio = body.precio_base !== undefined ? Number(body.precio_base) : undefined;
    const rawStock = body.stock !== undefined ? Number(body.stock) : undefined;

    if (rawPrecio !== undefined && (Number.isNaN(rawPrecio) || rawPrecio <= 0)) {
      return sendJSON(res, 400, { error: 'El precio debe ser un número mayor a cero' });
    }
    if (rawStock !== undefined && (Number.isNaN(rawStock) || rawStock < 0)) {
      return sendJSON(res, 400, { error: 'El stock debe ser un número mayor o igual a cero' });
    }

    const updates = {
      nombre: body.nombre ? sanitizeString(body.nombre) : undefined,
      descripcion: body.descripcion ? sanitizeString(body.descripcion) : undefined,
      tipo: body.tipo ? sanitizeString(body.tipo) : undefined,
      unidad_medida: body.unidad_medida ? sanitizeString(body.unidad_medida) : undefined,
      precio_base: rawPrecio,
      imagen_url: body.imagen_url ? sanitizeString(body.imagen_url) : undefined,
      stock: rawStock,
      activo: body.activo !== undefined ? (body.activo ? 1 : 0) : undefined,
    };

    const updateFields = [];
    const params = [];
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return sendJSON(res, 400, { error: 'No hay datos para actualizar' });
    }

    params.push(id);
    await query(`UPDATE productos SET ${updateFields.join(', ')} WHERE id = ?`, params);
    return sendJSON(res, 200, { message: 'Producto actualizado' });
  } catch (err) {
    if (err.message === 'Invalid JSON body' || err.status === 400) {
      throw err;
    }
    console.error('Error en operación de producto:', err.message || err);
    return sendJSON(res, 500, { error: 'Error interno al procesar el producto' });
  }
}

async function deleteProduct(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) {
    return sendJSON(res, 400, { error: 'ID de producto inválido' });
  }

  try {
    const existing = await query('SELECT id FROM productos WHERE id = ?', [id]);
    if (!Array.isArray(existing) || existing.length === 0) {
      return sendJSON(res, 404, { error: 'Producto no encontrado' });
    }

    await query('DELETE FROM productos WHERE id = ?', [id]);
    return sendJSON(res, 200, { message: 'Producto eliminado' });
  } catch (err) {
    if (err.message === 'Invalid JSON body' || err.status === 400) {
      throw err;
    }
    console.error('Error en operación de producto:', err.message || err);
    return sendJSON(res, 500, { error: 'Error interno al procesar el producto' });
  }
}

module.exports = {
  getProductList,
  getPublicProductList,
  getActiveProducts,
  getPublicProducts,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
