const productosController = require('../controllers/productos.controller.js');

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener lista de productos activos
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Lista de productos activos
 *
 * /api/productos/publicos:
 *   get:
 *     summary: Obtener lista de productos públicos para landing
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Lista pública de productos
 *
 * /api/admin/productos:
 *   get:
 *     summary: Obtener todos los productos (incluidos inactivos)
 *     tags:
 *       - Productos (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de productos
 *       403:
 *         description: No tiene permisos de admin
 *   post:
 *     summary: Crear nuevo producto
 *     tags:
 *       - Productos (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - tipo
 *               - unidad_medida
 *               - precio_base
 *               - stock
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               precio_base:
 *                 type: number
 *               imagen_url:
 *                 type: string
 *               stock:
 *                 type: number
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/productos/{id}:
 *   patch:
 *     summary: Actualizar producto existente
 *     tags:
 *       - Productos (Admin)
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
 *         description: Producto actualizado
 *       404:
 *         description: Producto no encontrado
 *   delete:
 *     summary: Eliminar producto
 *     tags:
 *       - Productos (Admin)
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
 *         description: Producto eliminado
 *       404:
 *         description: Producto no encontrado
 */

async function handleProductosRoutes(req, res, pathname, method, parts) {
  if (pathname === '/api/productos' && method === 'GET') {
    await productosController.getActiveProducts(req, res);
    return true;
  }
  if (pathname === '/api/productos/publicos' && method === 'GET') {
    await productosController.getPublicProducts(req, res);
    return true;
  }
  if (pathname === '/api/admin/productos' && method === 'GET') {
    await productosController.getAdminProducts(req, res);
    return true;
  }
  if (pathname === '/api/admin/productos' && method === 'POST') {
    await productosController.createProduct(req, res);
    return true;
  }
  if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'productos' && parts[3]) {
    const id = Number(parts[3]);
    if (method === 'PATCH') {
      await productosController.updateProduct(req, res, id);
      return true;
    }
    if (method === 'DELETE') {
      await productosController.deleteProduct(req, res, id);
      return true;
    }
  }
  return false;
}

module.exports = {
  handleProductosRoutes,
};
