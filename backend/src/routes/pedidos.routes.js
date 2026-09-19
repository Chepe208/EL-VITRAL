const pedidosController = require('../controllers/pedidos.controller.js');

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener pedidos del usuario autenticado
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Crear nuevo pedido a partir de una cotización
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cotizacion_id
 *             properties:
 *               cotizacion_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Pedido creado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Cotización no encontrada
 *       409:
 *         description: Cotización ya convertida
 *
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener detalle de pedido por ID
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del pedido
 *       404:
 *         description: Pedido no encontrado
 *
 * /api/pedidos/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de pedido por ID
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *       404:
 *         description: Pedido no encontrado
 *
 * /api/pedidos/{id}/create-checkout-session:
 *   post:
 *     summary: Crear sesión de pago en Stripe para un pedido
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_pago:
 *                 type: string
 *                 enum: [anticipo, pagado]
 *     responses:
 *       200:
 *         description: Sesión de Stripe creada
 *       400:
 *         description: Error en los datos o estado no apto
 *
 * /api/pedidos/{id}/pago-completado:
 *   post:
 *     summary: Registrar confirmación de pago Stripe
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stripe_session_id
 *               - tipo_pago
 *             properties:
 *               stripe_session_id:
 *                 type: string
 *               tipo_pago:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pago registrado correctamente
 *       400:
 *         description: Verificación fallida
 *
 * /api/admin/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos (Admin)
 *     tags:
 *       - Pedidos (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/pedidos/{id}:
 *   patch:
 *     summary: Actualizar estado o entrega de pedido (Admin)
 *     tags:
 *       - Pedidos (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *       404:
 *         description: Pedido no encontrado
 *
 * /api/admin/pedidos/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de pedido por ID (Admin)
 *     tags:
 *       - Pedidos (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *       404:
 *         description: Pedido no encontrado
 */

async function handlePedidosRoutes(req, res, pathname, method, parts) {
  // Admin pedidos
  if (pathname === '/api/admin/pedidos' && method === 'GET') {
    await pedidosController.getAdminOrders(req, res);
    return true;
  }
  if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'pedidos' && parts[3]) {
    const id = Number(parts[3]);
    if (parts[4] === 'pdf' && method === 'GET') {
      await pedidosController.getAdminOrderPdf(req, res, id);
      return true;
    }
    if (method === 'PATCH') {
      await pedidosController.updateAdminOrder(req, res, id);
      return true;
    }
  }

  // Usuario pedidos
  if (pathname === '/api/pedidos') {
    if (method === 'GET') {
      await pedidosController.getUserOrders(req, res);
      return true;
    }
    if (method === 'POST') {
      await pedidosController.createOrderFromQuote(req, res);
      return true;
    }
  }

  if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2]) {
    const pedidoId = Number(parts[2]);
    if (parts[3] === 'pdf' && method === 'GET') {
      await pedidosController.getOrderPdf(req, res, pedidoId);
      return true;
    }
    if (parts[3] === 'create-checkout-session' && method === 'POST') {
      await pedidosController.createCheckoutSession(req, res, pedidoId);
      return true;
    }
    if (parts[3] === 'pago-completado' && method === 'POST') {
      await pedidosController.completePayment(req, res, pedidoId);
      return true;
    }
    if (!parts[3] && method === 'GET') {
      await pedidosController.getOrderDetail(req, res, pedidoId);
      return true;
    }
  }

  return false;
}

module.exports = {
  handlePedidosRoutes,
};
