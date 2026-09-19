const authController = require('../controllers/auth.controller.js');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan García
 *               email:
 *                 type: string
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 example: micontraseña123
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Faltan datos requeridos
 *       409:
 *         description: El correo ya está registrado
 *
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 example: micontraseña123
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                     rol:
 *                       type: string
 *       401:
 *         description: Correo o contraseña incorrectos
 *       403:
 *         description: Cuenta inactiva o en espera de aprobación
 *
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 *
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autorizado
 *   patch:
 *     summary: Actualizar datos del usuario
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       401:
 *         description: No autorizado
 *       409:
 *         description: El correo ya está en uso
 *
 * /api/auth/ultimo-acceso:
 *   post:
 *     summary: Registrar último acceso del usuario
 *     tags:
 *       - Autenticación
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Último acceso registrado
 */

async function handleAuthRoutes(req, res, pathname, method) {
  if (pathname === '/api/auth/register' && method === 'POST') {
    await authController.register(req, res);
    return true;
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    await authController.login(req, res);
    return true;
  }
  if (pathname === '/api/auth/google' && method === 'POST') {
    await authController.googleLogin(req, res);
    return true;
  }
  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    await authController.forgotPassword(req, res);
    return true;
  }
  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    await authController.resetPassword(req, res);
    return true;
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    authController.logout(req, res);
    return true;
  }
  if (pathname === '/api/auth/refresh' && method === 'POST') {
    await authController.refresh(req, res);
    return true;
  }
  if (pathname === '/api/auth/session' && method === 'GET') {
    authController.getSessionInfo(req, res);
    return true;
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    await authController.getMe(req, res);
    return true;
  }
  if (pathname === '/api/auth/me' && method === 'PATCH') {
    await authController.updateMe(req, res);
    return true;
  }
  if (pathname === '/api/auth/ultimo-acceso' && method === 'POST') {
    await authController.recordLastAccess(req, res);
    return true;
  }
  return false;
}

module.exports = {
  handleAuthRoutes,
};
