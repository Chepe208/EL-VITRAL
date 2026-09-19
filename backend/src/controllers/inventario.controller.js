const { query } = require('../../lib/db.js');
const { requireAdmin, getUserFromRequest, sanitizeString } = require('../../lib/auth.js');
const { notifyStockMovement } = require('../../lib/notifications.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');

async function getInventoryMovements(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const movimientos = await query(`
    SELECT i.*, p.nombre AS producto_nombre, u.nombre AS usuario_nombre
    FROM inventario i
    LEFT JOIN productos p ON p.id = i.producto_id
    LEFT JOIN usuarios u ON u.id = i.usuario_id
    ORDER BY i.fecha_movimiento DESC
  `);
  return sendJSON(res, 200, Array.isArray(movimientos) ? movimientos.map(formatNumericRow) : []);
}

async function recordStockEntry(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const body = await parseBody(req);
  const producto_id = Number(body.producto_id);
  const cantidad = Number(body.cantidad);
  const descripcion = sanitizeString(body.descripcion || '');
  const tipo_movimiento = 'entrada';
  const userData = getUserFromRequest(req);

  if (Number.isNaN(producto_id) || Number.isNaN(cantidad) || cantidad <= 0) {
    return sendJSON(res, 400, { error: 'Producto y cantidad son obligatorios' });
  }
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  await query(
    'INSERT INTO inventario (producto_id, cantidad, tipo_movimiento, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)',
    [producto_id, cantidad, tipo_movimiento, descripcion || null, userData.id]
  );
  await query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, producto_id]);

  const prodRows = await query('SELECT nombre, stock FROM productos WHERE id = ?', [producto_id]);
  const admins = await query("SELECT email FROM usuarios WHERE rol = 'admin' AND activo = 1");
  if (Array.isArray(prodRows) && prodRows.length > 0 && Array.isArray(admins) && admins.length > 0) {
    notifyStockMovement(admins.map((a) => a.email), prodRows[0].nombre, cantidad, tipo_movimiento, prodRows[0].stock);
  }

  return sendJSON(res, 201, { message: 'Movimiento registrado' });
}

module.exports = {
  getInventoryMovements,
  recordStockEntry,
};
