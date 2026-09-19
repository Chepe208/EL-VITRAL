const agendaController = require('../controllers/agenda.controller.js');

/**
 * @swagger
 * /api/agenda/citas:
 *   get:
 *     summary: Obtener citas del usuario autenticado o todas si es admin
 *     tags:
 *       - Agenda
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de citas
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Agendar una nueva cita
 *     tags:
 *       - Agenda
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - titulo
 *               - fecha_cita
 *             properties:
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_cita:
 *                 type: string
 *                 format: date-time
 *               tipo:
 *                 type: string
 *                 enum: [consulta, medidas, otro]
 *               notas:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cita creada
 *       400:
 *         description: Horario o fecha no permitida
 *       429:
 *         description: Límite de tiempo entre citas no cumplido
 *   patch:
 *     summary: Actualizar una cita existente
 *     tags:
 *       - Agenda
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - titulo
 *               - fecha_cita
 *             properties:
 *               id:
 *                 type: integer
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               fecha_cita:
 *                 type: string
 *                 format: date-time
 *               tipo:
 *                 type: string
 *               estado:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cita actualizada
 *       404:
 *         description: Cita no encontrada
 *   delete:
 *     summary: Cancelar/eliminar una cita
 *     tags:
 *       - Agenda
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cita eliminada
 *
 * /api/agenda/dias-disponibles:
 *   get:
 *     summary: Obtener lista de fechas habilitadas para agendar citas
 *     tags:
 *       - Agenda
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fechas en formato YYYY-MM-DD
 *
 * /api/admin/agenda:
 *   get:
 *     summary: Obtener todas las citas (Admin)
 *     tags:
 *       - Agenda (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las citas
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/agenda/dias-disponibles:
 *   get:
 *     summary: Obtener fechas habilitadas (Admin)
 *     tags:
 *       - Agenda (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de fechas disponibles
 *   post:
 *     summary: Habilitar una nueva fecha para agendar citas (Admin)
 *     tags:
 *       - Agenda (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *                 example: 2026-10-01
 *     responses:
 *       201:
 *         description: Fecha habilitada
 *       400:
 *         description: Fecha inválida, pasada o fin de semana
 *       409:
 *         description: Fecha ya habilitada
 *   delete:
 *     summary: Deshabilitar una fecha para citas (Admin)
 *     tags:
 *       - Agenda (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha
 *             properties:
 *               fecha:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Fecha deshabilitada
 */

async function handleAgendaRoutes(req, res, pathname, method) {
  if (pathname === '/api/agenda/citas') {
    if (method === 'GET') {
      await agendaController.getUserAppointments(req, res);
      return true;
    }
    if (method === 'POST') {
      await agendaController.createAppointment(req, res);
      return true;
    }
    if (method === 'PATCH') {
      await agendaController.updateAppointment(req, res);
      return true;
    }
    if (method === 'DELETE') {
      await agendaController.deleteAppointment(req, res);
      return true;
    }
  }

  if (pathname === '/api/agenda/dias-disponibles' && method === 'GET') {
    await agendaController.getAvailableDays(req, res);
    return true;
  }

  if (pathname === '/api/admin/agenda' && method === 'GET') {
    await agendaController.getAdminAgenda(req, res);
    return true;
  }

  if (pathname === '/api/admin/agenda/dias-disponibles') {
    await agendaController.handleAdminDiasDisponibles(req, res, method);
    return true;
  }

  return false;
}

module.exports = {
  handleAgendaRoutes,
};
