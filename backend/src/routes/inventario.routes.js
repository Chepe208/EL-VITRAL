const inventarioController = require('../controllers/inventario.controller.js');

/**
 * @swagger
 * /api/admin/inventario:
 *   get:
 *     summary: Obtener historial de movimientos de inventario (Admin)
 *     tags:
 *       - Inventario (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de movimientos
 *       403:
 *         description: No tiene permisos de admin
 *   post:
 *     summary: Registrar entrada de inventario (Admin)
 *     tags:
 *       - Inventario (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - producto_id
 *               - cantidad
 *             properties:
 *               producto_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimiento registrado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos de admin
 */

async function handleInventarioRoutes(req, res, pathname, method) {
  if (pathname === '/api/admin/inventario') {
    if (method === 'GET') {
      await inventarioController.getInventoryMovements(req, res);
      return true;
    }
    if (method === 'POST') {
      await inventarioController.recordStockEntry(req, res);
      return true;
    }
  }
  return false;
}

module.exports = {
  handleInventarioRoutes,
};
