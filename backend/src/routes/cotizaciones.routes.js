const cotizacionesController = require('../controllers/cotizaciones.controller.js');
const { sanitizeString } = require('../../lib/auth.js');

/**
 * @swagger
 * /api/cotizaciones:
 *   get:
 *     summary: Obtener cotizaciones del usuario autenticado
 *     tags:
 *       - Cotizaciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cotizaciones
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Crear nueva cotización
 *     tags:
 *       - Cotizaciones
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cliente
 *               - productos
 *             properties:
 *               cliente:
 *                 type: object
 *                 required:
 *                   - nombre
 *                   - email
 *                   - telefono
 *                   - direccion
 *               productos:
 *                 type: array
 *     responses:
 *       201:
 *         description: Cotización creada
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *
 * /api/cotizaciones/{codigo}:
 *   get:
 *     summary: Obtener detalle de una cotización por código
 *     tags:
 *       - Cotizaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de cotización
 *       404:
 *         description: Cotización no encontrada
 *
 * /api/cotizaciones/{codigo}/pdf:
 *   get:
 *     summary: Descargar PDF de cotización por código
 *     tags:
 *       - Cotizaciones
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF generado
 *       404:
 *         description: Cotización no encontrada
 *
 * /api/admin/cotizaciones:
 *   get:
 *     summary: Obtener todas las cotizaciones (Admin)
 *     tags:
 *       - Cotizaciones (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cotizaciones
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/cotizaciones/{id}:
 *   patch:
 *     summary: Rechazar cotización (Admin)
 *     tags:
 *       - Cotizaciones (Admin)
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
 *         description: Cotización rechazada
 *       404:
 *         description: Cotización no encontrada
 *       409:
 *         description: Cotización ya convertida
 *
 * /api/admin/cotizaciones/{id}/pdf:
 *   get:
 *     summary: Descargar PDF de cotización por ID (Admin)
 *     tags:
 *       - Cotizaciones (Admin)
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
 *         description: Cotización no encontrada
 */

async function handleCotizacionesRoutes(req, res, pathname, method, parts) {
  // Admin cotizaciones
  if (pathname === '/api/admin/cotizaciones' && method === 'GET') {
    await cotizacionesController.getAdminQuotes(req, res);
    return true;
  }
  if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'cotizaciones' && parts[3]) {
    const id = Number(parts[3]);
    if (parts[4] === 'pdf' && method === 'GET') {
      await cotizacionesController.getAdminQuotePdf(req, res, id);
      return true;
    }
    if (method === 'PATCH') {
      await cotizacionesController.rejectAdminQuote(req, res, id);
      return true;
    }
  }

  // Usuario cotizaciones
  if (pathname === '/api/cotizaciones') {
    if (method === 'POST') {
      await cotizacionesController.createQuote(req, res);
      return true;
    }
    if (method === 'GET') {
      await cotizacionesController.getUserQuotes(req, res);
      return true;
    }
  }

  if (parts[0] === 'api' && parts[1] === 'cotizaciones' && parts[2]) {
    const codigo = sanitizeString(parts[2]);
    if (parts[3] === 'pdf' && method === 'GET') {
      await cotizacionesController.getQuotePdf(req, res, codigo);
      return true;
    }
    if (method === 'GET') {
      await cotizacionesController.getQuoteByCode(req, res, codigo);
      return true;
    }
  }

  return false;
}

module.exports = {
  handleCotizacionesRoutes,
};
