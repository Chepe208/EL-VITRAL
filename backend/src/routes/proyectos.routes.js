const proyectosController = require('../controllers/proyectos.controller.js');

/**
 * @swagger
 * /api/proyectos:
 *   get:
 *     summary: Obtener lista de proyectos destacados activos
 *     tags:
 *       - Proyectos
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *
 * /api/proyectos/{slug}:
 *   get:
 *     summary: Obtener detalle de proyecto por slug
 *     tags:
 *       - Proyectos
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del proyecto
 *       404:
 *         description: Proyecto no encontrado
 *
 * /api/admin/proyectos:
 *   get:
 *     summary: Obtener todos los proyectos destacados (Admin)
 *     tags:
 *       - Proyectos (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos
 *       403:
 *         description: No tiene permisos de admin
 *   post:
 *     summary: Crear nuevo proyecto destacado (Admin)
 *     tags:
 *       - Proyectos (Admin)
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
 *               - resumen
 *               - imagen_url
 *             properties:
 *               titulo:
 *                 type: string
 *               slug:
 *                 type: string
 *               resumen:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               imagen_url:
 *                 type: string
 *               tecnologias:
 *                 type: string
 *               orden:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Proyecto creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/proyectos/{id}:
 *   patch:
 *     summary: Actualizar proyecto destacado (Admin)
 *     tags:
 *       - Proyectos (Admin)
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
 *         description: Proyecto actualizado
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Proyecto no encontrado
 */

async function handleProyectosRoutes(req, res, pathname, method, parts) {
  if (pathname === '/api/proyectos' && method === 'GET') {
    await proyectosController.getPublicProjects(req, res);
    return true;
  }
  if (parts[0] === 'api' && parts[1] === 'proyectos' && parts[2] && method === 'GET') {
    await proyectosController.getProjectBySlug(req, res, parts[2]);
    return true;
  }
  if (pathname === '/api/admin/proyectos') {
    if (method === 'GET') {
      await proyectosController.getAdminProjects(req, res);
      return true;
    }
    if (method === 'POST') {
      await proyectosController.createAdminProject(req, res);
      return true;
    }
  }
  if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'proyectos' && parts[3] && method === 'PATCH') {
    const id = Number(parts[3]);
    await proyectosController.updateAdminProject(req, res, id);
    return true;
  }
  return false;
}

module.exports = {
  handleProyectosRoutes,
};
