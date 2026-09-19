const encuestasController = require('../controllers/encuestas.controller.js');

/**
 * @swagger
 * /api/encuestas/destacadas:
 *   get:
 *     summary: Obtener encuestas destacadas (> 4 estrellas) para la landing page
 *     tags:
 *       - Encuestas
 *     responses:
 *       200:
 *         description: Lista de opiniones y calificaciones de clientes
 *
 * /api/encuestas:
 *   post:
 *     summary: Registrar una encuesta de satisfacción para un pedido entregado
 *     tags:
 *       - Encuestas
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pedido_id
 *               - calificacion
 *             properties:
 *               pedido_id:
 *                 type: integer
 *               calificacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comentario:
 *                 type: string
 *     responses:
 *       201:
 *         description: Encuesta registrada
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No autorizado
 *       409:
 *         description: Encuesta ya respondida para este pedido
 *
 * /api/encuestas/pedidos/{id}:
 *   get:
 *     summary: Consultar estado de la encuesta de un pedido
 *     tags:
 *       - Encuestas
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
 *         description: Estado y detalle de la encuesta
 */

async function handleEncuestasRoutes(req, res, pathname, method, parts) {
  if (pathname === '/api/encuestas/destacadas' && method === 'GET') {
    await encuestasController.getFeaturedSurveys(req, res);
    return true;
  }
  if (pathname === '/api/encuestas' && method === 'POST') {
    await encuestasController.submitSurvey(req, res);
    return true;
  }
  if (parts[0] === 'api' && parts[1] === 'encuestas' && parts[2] === 'pedidos' && parts[3] && method === 'GET') {
    const pedidoId = Number(parts[3]);
    await encuestasController.getSurveyByOrderId(req, res, pedidoId);
    return true;
  }
  return false;
}

module.exports = {
  handleEncuestasRoutes,
};
