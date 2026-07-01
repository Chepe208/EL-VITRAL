const http = require('http');
const { URL } = require('url');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const { query } = require('./lib/db.js');
const {
  createPDFDocument,
  drawHeader,
  drawClientDetails,
  drawItemsTable,
  drawTotals,
  drawFooter,
} = require('./lib/pdfDesign.js');
const {
  hashPassword,
  comparePassword,
  sanitizeEmail,
  sanitizeString,
  generateToken,
  getUserFromRequest,
  isAdmin,
  requireAdmin,
  verifyToken,
} = require('./lib/auth.js');

const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// Crear app Express solo para Swagger
const expressApp = express();
expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
}));

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
 *
 * /api/productos:
 *   get:
 *     summary: Obtener lista de productos activos
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Lista de productos activos
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
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [vidrio, espejo, aluminio, otro]
 *               unidad_medida:
 *                 type: string
 *               precio_base:
 *                 type: number
 *               imagen_url:
 *                 type: string
 *               stock:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto creado
 *       400:
 *         description: Faltan campos requeridos
 *
 * /api/admin/productos/{id}:
 *   patch:
 *     summary: Actualizar producto
 *     tags:
 *       - Productos (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo:
 *                 type: string
 *               precio_base:
 *                 type: number
 *               stock:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       403:
 *         description: No tiene permisos de admin
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
 *           type: number
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/cotizaciones:
 *   get:
 *     summary: Obtener cotizaciones del usuario
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
 *                 properties:
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   direccion:
 *                     type: string
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     producto_id:
 *                       type: number
 *                     cantidad:
 *                       type: number
 *                     medida_largo:
 *                       type: number
 *                     medida_ancho:
 *                       type: number
 *     responses:
 *       201:
 *         description: Cotización creada
 *       400:
 *         description: Faltan datos requeridos
 *       401:
 *         description: No autorizado
 *
 * /api/cotizaciones/{codigo}:
 *   get:
 *     summary: Obtener detalles de una cotización
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
 *         description: Detalles de la cotización
 *       404:
 *         description: Cotización no encontrada
 *
 * /api/cotizaciones/{codigo}/pdf:
 *   get:
 *     summary: Descargar cotización en PDF
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
 *         description: PDF de la cotización
 *         content:
 *           application/pdf: {}
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
 *         description: Lista de todas las cotizaciones
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/cotizaciones/{id}/pdf:
 *   get:
 *     summary: Descargar cotización en PDF (Admin)
 *     tags:
 *       - Cotizaciones (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PDF de la cotización
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/pedidos:
 *   get:
 *     summary: Obtener pedidos del usuario
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos del usuario
 *       401:
 *         description: No autorizado
 *   post:
 *     summary: Crear nuevo pedido
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
 *               - fecha_entrega
 *             properties:
 *               cotizacion_id:
 *                 type: number
 *               fecha_entrega:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Pedido creado
 *       400:
 *         description: Faltan datos requeridos
 *       404:
 *         description: Cotización no encontrada
 *
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener detalles de un pedido
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Detalles del pedido
 *       404:
 *         description: Pedido no encontrado
 *
 * /api/pedidos/{id}/pdf:
 *   get:
 *     summary: Descargar pedido en PDF
 *     tags:
 *       - Pedidos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PDF del pedido
 *         content:
 *           application/pdf: {}
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
 *         description: Lista de todos los pedidos
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/pedidos/{id}:
 *   patch:
 *     summary: Actualizar estado del pedido
 *     tags:
 *       - Pedidos (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, listo, entregado]
 *               pago:
 *                 type: string
 *                 enum: [pendiente, pagado]
 *     responses:
 *       200:
 *         description: Pedido actualizado
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/pedidos/{id}/pdf:
 *   get:
 *     summary: Descargar pedido en PDF (Admin)
 *     tags:
 *       - Pedidos (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: PDF del pedido
 *       403:
 *         description: No tiene permisos de admin
 *
 * /api/admin/inventario:
 *   get:
 *     summary: Obtener movimientos de inventario
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
 *     summary: Registrar entrada de inventario
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
 *                 type: number
 *               cantidad:
 *                 type: number
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movimiento registrado
 *
 * /api/admin/usuarios:
 *   get:
 *     summary: Obtener lista de usuarios
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
 *     summary: Aprobar usuario
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
 *                 type: number
 *     responses:
 *       200:
 *         description: Usuario aprobado
 *
 * /api/agenda/citas:
 *   get:
 *     summary: Obtener citas del usuario
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
 *     summary: Crear nueva cita
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
 *               notas:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cita creada
 *   patch:
 *     summary: Actualizar cita
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
 *             properties:
 *               id:
 *                 type: number
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
 *   delete:
 *     summary: Eliminar cita
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
 *                 type: number
 *     responses:
 *       200:
 *         description: Cita eliminada
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
 */

function setHeaders(res, status = 200, contentType = 'application/json') {
  const headers = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  res.writeHead(status, headers);
}

function sendJSON(res, status, payload) {
  setHeaders(res, status, 'application/json');
  res.end(JSON.stringify(payload));
}

function sendPDF(res, filename, buildDoc) {
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  });

  const doc = createPDFDocument();
  doc.pipe(res);
  buildDoc(doc);
  doc.end();
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name) return cookies;
    cookies[name.trim()] = rest.join('=').trim();
    return cookies;
  }, {});
}

function extractRouteParts(pathname) {
  return pathname.split('/').filter(Boolean);
}

function formatNumericRow(row) {
  return Object.keys(row).reduce((acc, key) => {
    const value = row[key];

    if (typeof value === 'bigint') {
      acc[key] = Number(value);
    } else if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)) {
      acc[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        return resolve({});
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        console.error('Invalid JSON body received. Raw body:', body);
        console.error('Request headers:', req.headers);
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function createCookie(token) {
  const parts = [`token=${token}`, 'Path=/', `Max-Age=${60 * 60 * 24 * 7}`, 'SameSite=Lax'];
  if (isProduction) {
    parts.push('Secure');
  }
  parts.push('HttpOnly');
  return parts.join('; ');
}

function createExpiredCookie() {
  const parts = ['token=; Path=/', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'SameSite=Lax'];
  if (isProduction) {
    parts.push('Secure');
  }
  parts.push('HttpOnly');
  return parts.join('; ');
}

function generateUniqueCode() {
  return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function calculatePrice(product, item) {
  const cantidad = Number(item.cantidad) || 0;
  const medida_largo = Number(item.medida_largo) || 0;
  const medida_ancho = Number(item.medida_ancho) || 0;
  const precioBase = Number(product.precio_base) || 0;
  let precioUnitario = precioBase;
  let subtotal = 0;

  if (['vidrio', 'espejo'].includes(product.tipo)) {
    const area = (medida_largo * medida_ancho) / 10000;
    subtotal = precioBase * area * cantidad;
    precioUnitario = precioBase * area;
  } else if (product.tipo === 'aluminio') {
    subtotal = precioBase * (medida_largo / 100) * cantidad;
    precioUnitario = precioBase * (medida_largo / 100);
  } else {
    subtotal = precioBase * cantidad;
    precioUnitario = precioBase;
  }

  return {
    precioUnitario: Number(precioUnitario.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
  };
}

async function getProductList(activeOnly = true) {
  const sql = activeOnly
    ? 'SELECT * FROM productos WHERE activo = 1 ORDER BY id ASC'
    : 'SELECT * FROM productos ORDER BY id ASC';
  const rows = await query(sql);
  return Array.isArray(rows) ? rows.map(formatNumericRow) : [];
}

function formatPdfDate(value) {
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function mapPdfItems(detalles) {
  return detalles.map((item) => ({
    ...item,
    descripcion: item.descripcion || item.producto_nombre || 'Producto',
  }));
}

function buildQuotePdf(doc, cotizacion, detalles) {
  drawHeader(
    doc,
    'Cotización',
    cotizacion.codigo_unico,
    formatPdfDate(cotizacion.fecha_cotizacion),
    cotizacion.estado
  );

  drawClientDetails(doc, cotizacion, [
    { label: 'Código', value: cotizacion.codigo_unico },
    { label: 'Fecha', value: formatPdfDate(cotizacion.fecha_cotizacion) },
  ]);

  drawItemsTable(doc, mapPdfItems(detalles));
  drawTotals(doc, Number(cotizacion.subtotal) || 0, Number(cotizacion.total) || 0);
  drawFooter(doc);
}

function buildPedidoPdf(doc, pedido, detalles) {
  const client = {
    nombre_cliente: pedido.nombre_cliente || 'No especificado',
    email_cliente: pedido.email_cliente || 'No especificado',
    telefono_cliente: pedido.telefono_cliente,
    direccion_cliente: pedido.direccion_cliente,
  };

  drawHeader(
    doc,
    'Pedido',
    `#${pedido.id}`,
    formatPdfDate(pedido.fecha_pedido),
    pedido.estado
  );

  drawClientDetails(doc, client, [
    { label: 'Pedido', value: `#${pedido.id}` },
    { label: 'Entrega', value: pedido.fecha_entrega ? formatPdfDate(pedido.fecha_entrega) : 'Por definir' },
    { label: 'Pago', value: pedido.pago || 'pendiente' },
  ]);

  drawItemsTable(doc, mapPdfItems(detalles));
  drawTotals(doc, Number(pedido.total) || 0, Number(pedido.total) || 0);
  drawFooter(doc);
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // Si es una ruta de Swagger, dejarla pasar a Express
  if (pathname.startsWith('/api-docs')) {
    return expressApp(req, res);
  }

  if (method === 'OPTIONS') {
    setHeaders(res, 204);
    res.end();
    return;
  }

  if (pathname === '/' || pathname === '/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      message: 'EL VITRAL backend server is running',
      routes: ['/api/auth/*', '/api/productos', '/api/cotizaciones', '/api/pedidos', '/api/admin/*', '/api-docs'],
    });
  }

  try {
    // ===== REGISTER =====
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const nombre = sanitizeString(body.nombre);
      const email = sanitizeEmail(body.email);
      const password = sanitizeString(body.password);
      const telefono = sanitizeString(body.telefono || '');
      const direccion = sanitizeString(body.direccion || '');

      if (!nombre || !email || !password) {
        return sendJSON(res, 400, { error: 'Nombre, email y contraseña son obligatorios' });
      }

      const existing = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (Array.isArray(existing) && existing.length > 0) {
        return sendJSON(res, 409, { error: 'El correo ya está registrado' });
      }

      const hashedPassword = await hashPassword(password);
      await query(
        'INSERT INTO usuarios (nombre, email, password, telefono, direccion, rol, aprobado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [nombre, email, hashedPassword, telefono || null, direccion || null, 'usuario', true]
      );

      return sendJSON(res, 201, { message: 'Usuario registrado correctamente' });
    }

    // ===== LOGIN =====
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = sanitizeEmail(body.email);
      const password = sanitizeString(body.password);

      if (!email || !password) {
        return sendJSON(res, 400, { error: 'Email y contraseña son obligatorios' });
      }

      const rows = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 401, { error: 'Correo o contraseña incorrectos' });
      }

      const user = rows[0];
      const passwordMatches = await comparePassword(password, user.password);
      if (!passwordMatches) {
        return sendJSON(res, 401, { error: 'Correo o contraseña incorrectos' });
      }

      if (!user.activo) {
        return sendJSON(res, 403, { error: 'Cuenta inactiva' });
      }

      if (!user.aprobado) {
        return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
      }

      const token = generateToken({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
      const cookie = createCookie(token);
      res.setHeader('Set-Cookie', cookie);
      
      // 🔥 DEVOLVER EL TOKEN PARA BEARER AUTH
      return sendJSON(res, 200, { 
        message: 'Inicio de sesion exitoso',
        token: token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    }

    // ===== LOGOUT =====
    if (pathname === '/api/auth/logout' && method === 'POST') {
      res.setHeader('Set-Cookie', createExpiredCookie());
      return sendJSON(res, 200, { message: 'Sesión cerrada' });
    }

    // ===== GET ME =====
    if (pathname === '/api/auth/me' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const rows = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, ultimo_acceso FROM usuarios WHERE id = ?', [userData.id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 401, { error: 'Usuario no encontrado' });
      }

      return sendJSON(res, 200, rows[0]);
    }

    // ===== UPDATE ME =====
    if (pathname === '/api/auth/me' && method === 'PATCH') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const nombre = sanitizeString(body.nombre || '');
      const email = sanitizeEmail(body.email || '');
      const telefono = sanitizeString(body.telefono || '');
      const direccion = sanitizeString(body.direccion || '');

      if (!nombre || !email) {
        return sendJSON(res, 400, { error: 'Nombre y correo son obligatorios' });
      }

      const existing = await query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, userData.id]);
      if (Array.isArray(existing) && existing.length > 0) {
        return sendJSON(res, 409, { error: 'El correo ya está en uso' });
      }

      await query(
        'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
        [nombre, email, telefono || null, direccion || null, userData.id]
      );

      const updatedRows = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, ultimo_acceso FROM usuarios WHERE id = ?', [userData.id]);
      return sendJSON(res, 200, updatedRows[0]);
    }

    // ===== ULTIMO ACCESO =====
    if (pathname === '/api/auth/ultimo-acceso' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
      if (Number.isNaN(timestamp.getTime())) {
        return sendJSON(res, 400, { error: 'Timestamp inválido' });
      }

      await query('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', [timestamp, userData.id]);
      return sendJSON(res, 200, { message: 'Último acceso registrado' });
    }

    // ===== PRODUCTOS (público) =====
    if (pathname === '/api/productos' && method === 'GET') {
      const productos = await getProductList(true);
      return sendJSON(res, 200, productos);
    }

    // ===== ADMIN ROUTES =====
    // Todas las rutas /api/admin/* quedan protegidas aquí, en un único punto.
    // El rol de admin se asigna externamente (DB / panel interno); esta API
    // nunca permite que un usuario se autoasigne o modifique su propio rol.
    const adminPath = pathname.startsWith('/api/admin');
    const parts = extractRouteParts(pathname);

    if (adminPath && parts.length >= 2) {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) {
        return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      }
    }

    // ===== ADMIN PRODUCTOS =====
    if (pathname === '/api/admin/productos' && method === 'GET') {
      const productos = await getProductList(false);
      return sendJSON(res, 200, productos);
    }

    if (pathname === '/api/admin/productos' && method === 'POST') {
      const body = await parseBody(req);
      const nombre = sanitizeString(body.nombre || '');
      const descripcion = sanitizeString(body.descripcion || '');
      const tipo = sanitizeString(body.tipo || '');
      const unidad_medida = sanitizeString(body.unidad_medida || '');
      const precio_base = Number(body.precio_base || 0);
      const imagen_url = sanitizeString(body.imagen_url || '');
      const stock = Number(body.stock || 0);
      const activo = body.activo === false ? 0 : 1;

      if (!nombre || !tipo || !unidad_medida || precio_base <= 0) {
        return sendJSON(res, 400, { error: 'Faltan campos requeridos para crear el producto' });
      }

      const result = await query(
        'INSERT INTO productos (nombre, descripcion, tipo, unidad_medida, precio_base, imagen_url, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion || null, tipo, unidad_medida, precio_base, imagen_url || null, stock, activo]
      );

      return sendJSON(res, 201, { message: 'Producto creado', id: result.insertId });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'productos' && parts[3] && (method === 'PATCH' || method === 'DELETE')) {
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID de producto inválido' });
      }

      if (method === 'PATCH') {
        const body = await parseBody(req);
        const updates = {
          nombre: body.nombre ? sanitizeString(body.nombre) : undefined,
          descripcion: body.descripcion ? sanitizeString(body.descripcion) : undefined,
          tipo: body.tipo ? sanitizeString(body.tipo) : undefined,
          unidad_medida: body.unidad_medida ? sanitizeString(body.unidad_medida) : undefined,
          precio_base: body.precio_base !== undefined ? Number(body.precio_base) : undefined,
          imagen_url: body.imagen_url ? sanitizeString(body.imagen_url) : undefined,
          stock: body.stock !== undefined ? Number(body.stock) : undefined,
          activo: body.activo !== undefined ? (body.activo ? 1 : 0) : undefined,
        };

        const updateFields = [];
        const params = [];
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            updateFields.push(`${key} = ?`);
            params.push(value);
          }
        });

        if (updateFields.length === 0) {
          return sendJSON(res, 400, { error: 'No hay datos para actualizar' });
        }

        params.push(id);
        await query(`UPDATE productos SET ${updateFields.join(', ')} WHERE id = ?`, params);
        return sendJSON(res, 200, { message: 'Producto actualizado' });
      }

      if (method === 'DELETE') {
        await query('DELETE FROM productos WHERE id = ?', [id]);
        return sendJSON(res, 200, { message: 'Producto eliminado' });
      }
    }

    // ===== ADMIN COTIZACIONES =====
    if (pathname === '/api/admin/cotizaciones' && method === 'GET') {
      const cotizaciones = await query(`
        SELECT
          c.id,
          c.usuario_id,
          c.nombre_cliente,
          c.email_cliente,
          c.telefono_cliente,
          c.fecha_cotizacion,
          c.subtotal,
          c.total,
          c.estado,
          c.codigo_unico
        FROM cotizaciones c
        ORDER BY c.fecha_cotizacion DESC
      `);
      return sendJSON(res, 200, Array.isArray(cotizaciones) ? cotizaciones.map(formatNumericRow) : []);
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'cotizaciones' && parts[3] && parts[4] === 'pdf' && method === 'GET') {
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID inválido' });
      }

      const rows = await query('SELECT * FROM cotizaciones WHERE id = ?', [id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cotización no encontrada' });
      }
      const cotizacion = formatNumericRow(rows[0]);
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [id]
      );
      return sendPDF(res, `cotizacion-${id}.pdf`, (doc) => buildQuotePdf(doc, cotizacion, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
    }

    // ===== ADMIN PEDIDOS =====
    if (pathname === '/api/admin/pedidos' && method === 'GET') {
      const pedidos = await query(`
        SELECT
          p.*, u.nombre AS usuario_nombre, u.email AS usuario_email
        FROM pedidos p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        ORDER BY p.fecha_pedido DESC
      `);
      return sendJSON(res, 200, Array.isArray(pedidos) ? pedidos.map(formatNumericRow) : []);
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'pedidos' && parts[3] && method === 'PATCH') {
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }

      const body = await parseBody(req);
      const updates = {};
      if (body.estado) updates.estado = sanitizeString(body.estado);
      if (body.pago) updates.pago = sanitizeString(body.pago);

      const fields = [];
      const params = [];
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          fields.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (fields.length === 0) {
        return sendJSON(res, 400, { error: 'No hay cambios para guardar' });
      }

      params.push(id);
      await query(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`, params);
      return sendJSON(res, 200, { message: 'Pedido actualizado' });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'pedidos' && parts[3] && parts[4] === 'pdf' && method === 'GET') {
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID inválido' });
      }
      const rows = await query(`
        SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
        FROM pedidos p
        LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
        WHERE p.id = ?
      `, [id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedido = formatNumericRow(rows[0]);
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [pedido.cotizacion_id]
      );
      return sendPDF(res, `pedido-${id}.pdf`, (doc) => buildPedidoPdf(doc, pedido, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
    }

    // ===== ADMIN INVENTARIO =====
    if (pathname === '/api/admin/inventario' && method === 'GET') {
      const movimientos = await query(`
        SELECT i.*, p.nombre AS producto_nombre, u.nombre AS usuario_nombre
        FROM inventario i
        LEFT JOIN productos p ON p.id = i.producto_id
        LEFT JOIN usuarios u ON u.id = i.usuario_id
        ORDER BY i.fecha_movimiento DESC
      `);
      return sendJSON(res, 200, Array.isArray(movimientos) ? movimientos.map(formatNumericRow) : []);
    }

    if (pathname === '/api/admin/inventario' && method === 'POST') {
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

      await query('INSERT INTO inventario (producto_id, cantidad, tipo_movimiento, descripcion, usuario_id) VALUES (?, ?, ?, ?, ?)', [producto_id, cantidad, tipo_movimiento, descripcion || null, userData.id]);
      await query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, producto_id]);
      return sendJSON(res, 201, { message: 'Movimiento registrado' });
    }

    // ===== ADMIN USUARIOS =====
    if (pathname === '/api/admin/usuarios' && method === 'GET') {
      const usuarios = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, ultimo_acceso FROM usuarios ORDER BY fecha_registro DESC');
      return sendJSON(res, 200, Array.isArray(usuarios) ? usuarios.map(formatNumericRow) : []);
    }

    if (pathname === '/api/admin/usuarios' && method === 'PATCH') {
      const body = await parseBody(req);
      const id = Number(body.id);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID de usuario inválido' });
      }
      await query('UPDATE usuarios SET aprobado = 1 WHERE id = ?', [id]);
      return sendJSON(res, 200, { message: 'Usuario aprobado' });
    }

    // ===== COTIZACIONES =====
    if (pathname === '/api/cotizaciones' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      let cliente;
      try {
        cliente = {
          nombre: sanitizeString(body.cliente?.nombre || ''),
          email: sanitizeEmail(body.cliente?.email || ''),
          telefono: sanitizeString(body.cliente?.telefono || ''),
          direccion: sanitizeString(body.cliente?.direccion || ''),
        };
      } catch (error) {
        return sendJSON(res, 400, { error: error.message || 'Datos del cliente inválidos' });
      }
      const productos = Array.isArray(body.productos) ? body.productos : [];

      if (!cliente.nombre || !cliente.email || !cliente.telefono || !cliente.direccion || productos.length === 0) {
        return sendJSON(res, 400, { error: 'Faltan datos del cliente o productos' });
      }

      const productIds = productos.map((item) => Number(item.producto_id)).filter((id) => !Number.isNaN(id));
      if (productIds.length === 0) {
        return sendJSON(res, 400, { error: 'Productos inválidos' });
      }

      const placeholders = productIds.map(() => '?').join(', ');
      const productRows = await query(`SELECT * FROM productos WHERE id IN (${placeholders})`, productIds);
      const availableProducts = Array.isArray(productRows) ? productRows : [];
      if (availableProducts.length === 0) {
        return sendJSON(res, 400, { error: 'No se encontraron productos válidos' });
      }

      const quoteItems = productos.map((item) => {
        const product = availableProducts.find((p) => Number(p.id) === Number(item.producto_id));
        return { item, product };
      });

      if (quoteItems.some((entry) => !entry.product)) {
        return sendJSON(res, 400, { error: 'Algunos productos son inválidos' });
      }

      let subtotal = 0;
      const detalleValues = [];
      quoteItems.forEach(({ item, product }) => {
        const precio = calculatePrice(product, item);
        subtotal += precio.subtotal;
        detalleValues.push([
          null,
          Number(product.id),
          product.nombre,
          Number(item.cantidad || 0),
          item.medida_largo ? Number(item.medida_largo) : null,
          item.medida_ancho ? Number(item.medida_ancho) : null,
          item.grosor !== undefined ? Number(item.grosor) : null,
          precio.precioUnitario,
          precio.subtotal,
        ]);
      });

      subtotal = Number(subtotal.toFixed(2));
      const total = subtotal;
      const codigo = generateUniqueCode();

      const result = await query(
        'INSERT INTO cotizaciones (usuario_id, nombre_cliente, email_cliente, telefono_cliente, direccion_cliente, subtotal, total, estado, codigo_unico) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userData.id, cliente.nombre, cliente.email, cliente.telefono, cliente.direccion, subtotal, total, 'vigente', codigo]
      );

      const cotizacionId = result.insertId;
      for (const detalle of detalleValues) {
        detalle[0] = cotizacionId;
        await query(
          'INSERT INTO cotizacion_detalles (cotizacion_id, producto_id, descripcion, cantidad, medida_largo, medida_ancho, grosor, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          detalle
        );
      }

      return sendJSON(res, 201, { codigo });
    }

    if (pathname === '/api/cotizaciones' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      if (isAdmin(userData)) {
        const rows = await query('SELECT * FROM cotizaciones ORDER BY fecha_cotizacion DESC');
        return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
      }
      const rows = await query('SELECT * FROM cotizaciones WHERE usuario_id = ? ORDER BY fecha_cotizacion DESC', [userData.id]);
      return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
    }

    if (parts[0] === 'api' && parts[1] === 'cotizaciones' && parts[2] && parts[3] === 'pdf' && method === 'GET') {
      const codigo = sanitizeString(parts[2]);
      const rows = await query('SELECT * FROM cotizaciones WHERE codigo_unico = ?', [codigo]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cotización no encontrada' });
      }
      const cotizacion = formatNumericRow(rows[0]);
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [cotizacion.id]
      );
      return sendPDF(res, `cotizacion-${cotizacion.id}.pdf`, (doc) => buildQuotePdf(doc, cotizacion, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
    }

    if (parts[0] === 'api' && parts[1] === 'cotizaciones' && parts[2] && method === 'GET') {
      const codigo = sanitizeString(parts[2]);
      const rows = await query('SELECT * FROM cotizaciones WHERE codigo_unico = ?', [codigo]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cotización no encontrada' });
      }
      const cotizacion = formatNumericRow(rows[0]);
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [cotizacion.id]
      );
      return sendJSON(res, 200, {
        ...cotizacion,
        detalles: Array.isArray(detalles) ? detalles.map(formatNumericRow) : [],
      });
    }

    // ===== PEDIDOS =====
    if (pathname === '/api/pedidos' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      const rows = await query('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY fecha_pedido DESC', [userData.id]);
      return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
    }

    if (pathname === '/api/pedidos' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      const body = await parseBody(req);
      const cotizacion_id = Number(body.cotizacion_id);
      const fecha_entrega = sanitizeString(body.fecha_entrega || '');
      if (Number.isNaN(cotizacion_id) || !fecha_entrega) {
        return sendJSON(res, 400, { error: 'ID de cotización y fecha de entrega son obligatorios' });
      }
      const rows = await query('SELECT * FROM cotizaciones WHERE id = ?', [cotizacion_id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cotización no encontrada' });
      }
      const cotizacion = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const result = await query(
        'INSERT INTO pedidos (cotizacion_id, usuario_id, fecha_entrega, estado, pago, total) VALUES (?, ?, ?, ?, ?, ?)',
        [cotizacion_id, userData.id, fecha_entrega, 'pendiente', 'pendiente', cotizacion.total]
      );
      await query('UPDATE cotizaciones SET estado = ? WHERE id = ?', ['convertida', cotizacion_id]);
      return sendJSON(res, 201, { message: 'Pedido creado', id: result.insertId });
    }

    if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2] && method === 'GET') {
      const pedidoId = Number(parts[2]);
      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      const rows = await query(`
        SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
        FROM pedidos p
        LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
        WHERE p.id = ?
      `, [pedidoId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedido = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [pedido.cotizacion_id]
      );
      return sendJSON(res, 200, { ...pedido, detalles: Array.isArray(detalles) ? detalles.map(formatNumericRow) : [] });
    }

    if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2] && parts[3] === 'pdf' && method === 'GET') {
      const pedidoId = Number(parts[2]);
      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      const rows = await query(`
        SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
        FROM pedidos p
        LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
        WHERE p.id = ?
      `, [pedidoId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedido = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [pedido.cotizacion_id]
      );
      return sendPDF(res, `pedido-${pedidoId}.pdf`, (doc) => buildPedidoPdf(doc, pedido, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
    }

    // ===== CHAT ROUTES =====
    if (pathname === '/api/chat' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const rows = await query(
        'SELECT id, usuario_id, contenido, remitente, leido, fecha_envio FROM mensajes_chat WHERE usuario_id = ? ORDER BY fecha_envio DESC LIMIT 50',
        [userData.id]
      );
      return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow).reverse() : []);
    }

    if (pathname === '/api/chat' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const contenido = sanitizeString(body.contenido || '');
      if (!contenido) {
        return sendJSON(res, 400, { error: 'El contenido del mensaje es obligatorio' });
      }

      const result = await query(
        'INSERT INTO mensajes_chat (usuario_id, contenido, remitente) VALUES (?, ?, ?)',
        [userData.id, contenido, 'usuario']
      );

      return sendJSON(res, 201, { id: result.insertId, mensaje: 'Mensaje enviado' });
    }

    if (pathname === '/api/chat/marcar-leido' && method === 'PATCH') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const messageId = Number(body.id);
      if (!messageId) {
        return sendJSON(res, 400, { error: 'ID de mensaje es obligatorio' });
      }

      await query(
        'UPDATE mensajes_chat SET leido = true WHERE id = ? AND usuario_id = ?',
        [messageId, userData.id]
      );

      return sendJSON(res, 200, { mensaje: 'Mensaje marcado como leído' });
    }

    // ===== AGENDA ROUTES =====
    if (pathname === '/api/agenda/citas' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      let query_str = 'SELECT id, usuario_id, titulo, descripcion, fecha_cita, tipo, estado, notas, fecha_creacion FROM citas_agenda WHERE usuario_id = ? ORDER BY fecha_cita ASC';
      let params = [userData.id];

      if (isAdmin(userData)) {
        query_str = 'SELECT id, usuario_id, titulo, descripcion, fecha_cita, tipo, estado, notas, fecha_creacion FROM citas_agenda ORDER BY fecha_cita ASC';
        params = [];
      }

      const rows = await query(query_str, params);
      return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
    }

    if (pathname === '/api/agenda/citas' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const titulo = sanitizeString(body.titulo || '');
      const descripcion = sanitizeString(body.descripcion || '');
      const fecha_cita = body.fecha_cita ? new Date(body.fecha_cita) : null;
      const tipo = body.tipo || 'otro';
      const notas = sanitizeString(body.notas || '');

      if (!titulo || !fecha_cita || Number.isNaN(fecha_cita.getTime())) {
        return sendJSON(res, 400, { error: 'Título y fecha de cita son obligatorios' });
      }

      const result = await query(
        'INSERT INTO citas_agenda (usuario_id, titulo, descripcion, fecha_cita, tipo, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.id, titulo, descripcion || null, fecha_cita, tipo, 'pendiente', notas || null]
      );

      return sendJSON(res, 201, { id: result.insertId, mensaje: 'Cita creada exitosamente' });
    }

    if (pathname === '/api/agenda/citas' && method === 'PATCH') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const citaId = Number(body.id);
      const titulo = sanitizeString(body.titulo || '');
      const descripcion = sanitizeString(body.descripcion || '');
      const fecha_cita = body.fecha_cita ? new Date(body.fecha_cita) : null;
      const tipo = body.tipo || 'otro';
      const estado = body.estado || 'pendiente';
      const notas = sanitizeString(body.notas || '');

      if (!citaId || !titulo || !fecha_cita) {
        return sendJSON(res, 400, { error: 'ID, título y fecha son obligatorios' });
      }

      const rows = await query('SELECT usuario_id FROM citas_agenda WHERE id = ?', [citaId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cita no encontrada' });
      }

      if (!isAdmin(userData) && rows[0].usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      await query(
        'UPDATE citas_agenda SET titulo = ?, descripcion = ?, fecha_cita = ?, tipo = ?, estado = ?, notas = ? WHERE id = ?',
        [titulo, descripcion || null, fecha_cita, tipo, estado, notas || null, citaId]
      );

      return sendJSON(res, 200, { mensaje: 'Cita actualizada exitosamente' });
    }

    if (pathname === '/api/agenda/citas' && method === 'DELETE') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const citaId = Number(body.id);

      if (!citaId) {
        return sendJSON(res, 400, { error: 'ID de cita es obligatorio' });
      }

      const rows = await query('SELECT usuario_id FROM citas_agenda WHERE id = ?', [citaId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cita no encontrada' });
      }

      if (!isAdmin(userData) && rows[0].usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      await query('DELETE FROM citas_agenda WHERE id = ?', [citaId]);
      return sendJSON(res, 200, { mensaje: 'Cita eliminada exitosamente' });
    }

    // ===== ADMIN AGENDA =====
    if (pathname === '/api/admin/agenda' && method === 'GET') {
      try {
        const rows = await query(
          'SELECT id, usuario_id, titulo, descripcion, fecha_cita, tipo, estado, notas, fecha_creacion FROM citas_agenda ORDER BY fecha_cita DESC'
        );
        return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
      } catch (error) {
        console.error('Error fetching admin agenda:', error);
        return sendJSON(res, 500, { error: 'Error al cargar la agenda: ' + error.message });
      }
    }

    return sendJSON(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    console.error('Request error:', error);
    sendJSON(res, 500, { error: 'Error interno del servidor' });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`📚 Swagger docs disponible en http://localhost:${port}/api-docs`);
  });
}

module.exports = server;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: puerto ${port} ya está en uso. Cierra el servidor que se está ejecutando en ese puerto o elige otro puerto con PORT=<otro_puerto>.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});