const { query } = require('../../lib/db.js');
const {
  getUserFromRequest,
  isAdmin,
  requireAdmin,
  sanitizeString,
  sanitizeEmail,
} = require('../../lib/auth.js');
const { notifyQuoteRejected } = require('../../lib/notifications.js');
const { sendJSON, sendPDF, parseBody } = require('../utils/http.js');
const { formatNumericRow, generateUniqueCode } = require('../utils/formatters.js');
const { esCelularColombia } = require('../utils/validators.js');
const { calculatePrice } = require('../services/pricing.service.js');
const { buildQuotePdf } = require('../services/pdf.service.js');
const { MINIMUM_QUOTE_TOTAL_COP, MEDIDA_MAXIMA_CM } = require('../config/constants.js');

async function createQuote(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  let cliente;
  try {
    cliente = {
      nombre: sanitizeString(body.cliente?.nombre || ''),
      email: sanitizeEmail(body.cliente?.email || ''),
      telefono: sanitizeString(body.cliente?.telefono || ''),
      direccion: sanitizeString(body.cliente?.direccion || ''),
    };
  } catch (error) {
    return sendJSON(res, 400, { error: error.message || 'Datos del cliente inválidos' });
  }
  const productos = Array.isArray(body.productos) ? body.productos : [];

  if (!cliente.nombre || !cliente.email || !cliente.telefono || !cliente.direccion || productos.length === 0) {
    return sendJSON(res, 400, { error: 'Faltan datos del cliente o productos' });
  }

  const productIds = productos.map((item) => Number(item.producto_id)).filter((id) => !Number.isNaN(id));
  if (productIds.length === 0) {
    return sendJSON(res, 400, { error: 'Productos inválidos' });
  }

  const placeholders = productIds.map(() => '?').join(', ');
  const productRows = await query(`SELECT * FROM productos WHERE id IN (${placeholders})`, productIds);
  const availableProducts = Array.isArray(productRows) ? productRows : [];
  if (availableProducts.length === 0) {
    return sendJSON(res, 400, { error: 'No se encontraron productos válidos' });
  }

  const quoteItems = productos.map((item) => {
    const product = availableProducts.find((p) => Number(p.id) === Number(item.producto_id));
    return { item, product };
  });

  if (quoteItems.some((entry) => !entry.product)) {
    return sendJSON(res, 400, { error: 'Algunos productos son inválidos' });
  }

  if (!esCelularColombia(cliente.telefono)) {
    return sendJSON(res, 400, { error: 'Ingresa un número de celular válido (por ejemplo, 3001234567)' });
  }

  for (const { item, product } of quoteItems) {
    const cantidad = Number(item.cantidad);
    if (!Number.isFinite(cantidad) || cantidad < 1) {
      return sendJSON(res, 400, { error: 'Todos los productos deben tener una cantidad mayor a 0' });
    }
    const requiereLargo = ['vidrio', 'espejo', 'aluminio'].includes(product.tipo);
    const requiereAncho = ['vidrio', 'espejo'].includes(product.tipo);
    const largo = Number(item.medida_largo || NaN);
    const ancho = Number(item.medida_ancho || NaN);
    if (requiereLargo && (!Number.isFinite(largo) || largo <= 0 || largo > MEDIDA_MAXIMA_CM)) {
      return sendJSON(res, 400, { error: 'Las medidas deben ser mayores a 0 y no exceder los 250 cm por lado' });
    }
    if (requiereAncho && (!Number.isFinite(ancho) || ancho <= 0 || ancho > MEDIDA_MAXIMA_CM)) {
      return sendJSON(res, 400, { error: 'Las medidas deben ser mayores a 0 y no exceder los 250 cm por lado' });
    }
  }

  let subtotal = 0;
  const detalleValues = [];
  quoteItems.forEach(({ item, product }) => {
    const precio = calculatePrice(product, item);
    subtotal += precio.subtotal;
    detalleValues.push([
      null,
      Number(product.id),
      product.nombre,
      Number(item.cantidad || 0),
      item.medida_largo ? Number(item.medida_largo) : null,
      item.medida_ancho ? Number(item.medida_ancho) : null,
      item.grosor !== undefined ? Number(item.grosor) : null,
      precio.precioUnitario,
      precio.subtotal,
    ]);
  });

  subtotal = Number(subtotal.toFixed(2));
  const total = subtotal;
  if (total < MINIMUM_QUOTE_TOTAL_COP) {
    return sendJSON(res, 400, {
      error: `El valor mínimo para una cotización es de $${MINIMUM_QUOTE_TOTAL_COP.toLocaleString('es-CO')} COP`,
    });
  }
  const codigo = generateUniqueCode();

  const result = await query(
    'INSERT INTO cotizaciones (usuario_id, nombre_cliente, email_cliente, telefono_cliente, direccion_cliente, subtotal, total, estado, codigo_unico) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userData.id, cliente.nombre, cliente.email, cliente.telefono, cliente.direccion, subtotal, total, 'vigente', codigo]
  );

  const cotizacionId = result.insertId;
  for (const detalle of detalleValues) {
    detalle[0] = cotizacionId;
    await query(
      'INSERT INTO cotizacion_detalles (cotizacion_id, producto_id, descripcion, cantidad, medida_largo, medida_ancho, grosor, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      detalle
    );
  }

  return sendJSON(res, 201, { codigo });
}

async function getUserQuotes(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  const rows = await query('SELECT * FROM cotizaciones WHERE usuario_id = ? ORDER BY fecha_cotizacion DESC', [userData.id]);
  return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
}

async function getQuoteByCode(req, res, codigo) {
  const rows = await query('SELECT * FROM cotizaciones WHERE codigo_unico = ?', [codigo]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  const cotizacion = formatNumericRow(rows[0]);
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [cotizacion.id]
  );
  return sendJSON(res, 200, {
    ...cotizacion,
    detalles: Array.isArray(detalles) ? detalles.map(formatNumericRow) : [],
  });
}

async function getQuotePdf(req, res, codigo) {
  const rows = await query('SELECT * FROM cotizaciones WHERE codigo_unico = ?', [codigo]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  const cotizacion = formatNumericRow(rows[0]);
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [cotizacion.id]
  );
  return sendPDF(res, `cotizacion-${cotizacion.id}.pdf`, (doc) => buildQuotePdf(doc, cotizacion, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
}

async function getAdminQuotes(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const cotizaciones = await query(`
    SELECT
      c.id,
      c.usuario_id,
      c.nombre_cliente,
      c.email_cliente,
      c.telefono_cliente,
      c.fecha_cotizacion,
      c.subtotal,
      c.total,
      c.estado,
      c.codigo_unico
    FROM cotizaciones c
    ORDER BY c.fecha_cotizacion DESC
  `);
  return sendJSON(res, 200, Array.isArray(cotizaciones) ? cotizaciones.map(formatNumericRow) : []);
}

async function rejectAdminQuote(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) return sendJSON(res, 400, { error: 'ID inválido' });

  const rows = await query(
    'SELECT id, estado, codigo_unico, nombre_cliente, email_cliente FROM cotizaciones WHERE id = ?',
    [id]
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  if (rows[0].estado === 'convertida') {
    return sendJSON(res, 409, { error: 'Una cotización convertida no puede ser rechazada' });
  }

  const result = await query('UPDATE cotizaciones SET estado = ? WHERE id = ?', ['rechazada', id]);
  if (!result || result.affectedRows === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  if (typeof notifyQuoteRejected === 'function') {
    await notifyQuoteRejected(rows[0].email_cliente, rows[0].codigo_unico, rows[0].nombre_cliente);
  }
  return sendJSON(res, 200, { message: 'Cotización rechazada', estado: 'rechazada' });
}

async function getAdminQuotePdf(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) {
    return sendJSON(res, 400, { error: 'ID inválido' });
  }

  const rows = await query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  const cotizacion = formatNumericRow(rows[0]);
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [id]
  );
  return sendPDF(res, `cotizacion-${id}.pdf`, (doc) => buildQuotePdf(doc, cotizacion, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
}

module.exports = {
  createQuote,
  getUserQuotes,
  getQuoteByCode,
  getQuotePdf,
  getAdminQuotes,
  rejectAdminQuote,
  getAdminQuotePdf,
};
