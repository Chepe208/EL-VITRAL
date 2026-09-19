const usuariosController = require('../controllers/usuarios.controller.js');

/**
 * @swagger
 * /api/admin/usuarios:
 *   get:
 *     summary: Obtener lista de todos los usuarios (Admin)
 *     tags:
 *       - Usuarios (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: No tiene permisos de admin
 *   patch:
 *     summary: Actualizar estado, aprobación o rol de un usuario (Admin)
 *     tags:
 *       - Usuarios (Admin)
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
 *                 type: string
 *               aprobado:
 *                 type: boolean
 *               activo:
 *                 type: boolean
 *               rol:
 *                 type: string
 *                 enum: [usuario, admin]
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos de admin
 *       404:
 *         description: Usuario no encontrado
 */

async function handleUsuariosRoutes(req, res, pathname, method) {
  if (pathname === '/api/admin/usuarios') {
    if (method === 'GET') {
      await usuariosController.getAdminUsers(req, res);
      return true;
    }
    if (method === 'PATCH') {
      await usuariosController.updateAdminUser(req, res);
      return true;
    }
  }
  return false;
}

module.exports = {
  handleUsuariosRoutes,
};
