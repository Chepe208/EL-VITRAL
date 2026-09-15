require('dotenv').config();

const http = require('http');
const { URL } = require('url');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

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
  generateAccessToken,
  generateRefreshToken,
  getUserFromRequest,
  isAdmin,
  requireAuth,
  requireAdmin,
  verifyAccessToken,
  verifyRefreshToken,
  createSession,
  getSession,
  deleteSession,
} = require('./lib/auth.js');
const { createPasswordResetToken, sendPasswordResetEmail } = require('./lib/email.js');
const { notifyOrderCreated, notifyOrderStateChange, notifyAppointment, notifyStockMovement, notifyPaymentReceived } = require('./lib/notifications.js');
const { checkRate, rateLimitError, getClientIp } = require('./lib/rateLimit.js');

const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';
const COP_CURRENCY = 'cop';

const COP_MINOR_UNIT_MULTIPLIER = 100;
const MINIMUM_QUOTE_TOTAL_COP = 10000;

function toStripeCopAmount(amountInCop) {
  return Math.round(Number(amountInCop) * COP_MINOR_UNIT_MULTIPLIER);
}

function getPaymentAmountInCop(total, currentPaymentStatus, paymentType) {
  const normalizedTotal = Math.round(Number(total));
  if (!Number.isFinite(normalizedTotal) || normalizedTotal < MINIMUM_QUOTE_TOTAL_COP) {
    return null;
  }

  if (paymentType === 'anticipo') {
    return currentPaymentStatus === 'pendiente' ? Math.round(normalizedTotal / 2) : null;
  }

  if (paymentType === 'pagado') {
    return currentPaymentStatus === 'anticipo'
      ? normalizedTotal - Math.round(normalizedTotal / 2)
      : currentPaymentStatus === 'pendiente'
        ? normalizedTotal
        : null;
  }

  return null;
}

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

function createProjectSlug(value) {
  return sanitizeString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180);
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
        console.error('Invalid JSON body received:', {
          method: req.method,
          url: req.url ? req.url.split('?')[0] : '',
          contentType: (req.headers && req.headers['content-type']) || null,
          contentLength: body ? Buffer.byteLength(body, 'utf8') : 0,
          error: error.name || 'SyntaxError',
        });
        const err = new Error('Invalid JSON body');
        err.status = 400;
        reject(err);
      }
    });

    req.on('error', reject);
  });
}

function expiredCookie(name) {
  const parts = [`${name}=; Path=/`, 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'SameSite=Lax'];
  if (isProduction) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function createSessionCookies(sid) {
  // Limpia las cookies viejas con token y establece la nueva cookie opaca.
  return [
    expiredCookie('accessToken'),
    expiredCookie('token'),
    createCookie(sid),
  ];
}

function createCookie(sid) {
  const parts = [`sid=${sid}`, 'Path=/', 'SameSite=Lax'];

  if (isProduction) {
    parts.push('Secure');
  }

  parts.push('HttpOnly');

  return parts.join('; ');
}

function clearCookies() {
  return [
    expiredCookie('accessToken'),
    expiredCookie('token'),
    expiredCookie('sid'),
  ];
}

function generateUniqueCode() {
  return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function ensurePasswordResetColumns() {
  const tokenColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'reset_token'");
  if (!Array.isArray(tokenColumn) || tokenColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) NULL');
  }

  const expiresColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'reset_expires_at'");
  if (!Array.isArray(expiresColumn) || expiresColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN reset_expires_at DATETIME NULL');
  }
}

async function ensureGoogleIdColumn() {
  const googleColumn = await query("SHOW COLUMNS FROM usuarios LIKE 'google_id'");
  if (!Array.isArray(googleColumn) || googleColumn.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255) NULL');
    await query('CREATE UNIQUE INDEX idx_usuarios_google_id ON usuarios (google_id)');
  }
}

async function ensureAgendaDiasDisponiblesTable() {
  try {
    await query(
      'CREATE TABLE IF NOT EXISTS agenda_dias_disponibles (' +
        'id INT PRIMARY KEY AUTO_INCREMENT, ' +
        'fecha DATE NOT NULL, ' +
        'fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ' +
        'UNIQUE KEY uq_agenda_fecha (fecha)' +
        ')'
    );
  } catch (error) {
    console.error('Error ensuring agenda_dias_disponibles table:', error.message);
  }
}

async function ensureUltimaAgendaColumn() {
  const col = await query("SHOW COLUMNS FROM usuarios LIKE 'ultima_agenda'");
  if (!Array.isArray(col) || col.length === 0) {
    await query('ALTER TABLE usuarios ADD COLUMN ultima_agenda DATETIME NULL');
  }
}

async function ensureConsentColumns() {
  const columns = [
    ['politica_datos_aceptada', 'BOOLEAN NOT NULL DEFAULT false'],
    ['politica_datos_aceptada_at', 'TIMESTAMP NULL'],
    ['terminos_aceptados', 'BOOLEAN NOT NULL DEFAULT false'],
    ['terminos_aceptados_at', 'TIMESTAMP NULL'],
  ];
  for (const [name, definition] of columns) {
    const result = await query('SHOW COLUMNS FROM usuarios LIKE ?', [name]);
    if (!Array.isArray(result) || result.length === 0) {
      await query(`ALTER TABLE usuarios ADD COLUMN ${name} ${definition}`);
    }
  }
}

const TIPOS_CITA_VALIDOS = ['consulta', 'medidas', 'otro'];

const MINUTO_INICIO_JORNADA = 8 * 60;
const MINUTO_FIN_JORNADA = 17 * 60;

function validarHorarioCita(fecha) {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) {
    return 'Las citas solo se pueden agendar de lunes a viernes.';
  }
  const totalMinutos = fecha.getHours() * 60 + fecha.getMinutes();
  if (totalMinutos < MINUTO_INICIO_JORNADA || totalMinutos > MINUTO_FIN_JORNADA) {
    return 'Las citas solo se pueden agendar entre las 8:00 a. m. y las 5:00 p. m.';
  }
  return null;
}

function toFechaLocalDateKey(fecha) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

async function validarDominioEmail(email) {
  const domain = email.split('@')[1];
  try {
    const mxRecords = await require('dns').promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return 'El dominio del correo no es válido (no recibe correos)';
    }
  } catch (err) {
    return 'El dominio del correo no existe o no es válido';
  }
  return null;
}

function calculatePrice(product, item) {
  const cantidad = Number(item.cantidad) || 0;
  const medida_largo = Number(item.medida_largo) || 0;
  const medida_ancho = Number(item.medida_ancho) || 0;
  const precioBase = Number(product.precio_base) || 0;
  let precioUnitario = precioBase;
  let subtotal = 0;

  if (['vidrio', 'espejo'].includes(product.tipo)) {
    const largoRedondeado = Math.ceil(medida_largo / 10) * 10;
    const anchoRedondeado = Math.ceil(medida_ancho / 10) * 10;
    precioUnitario = (largoRedondeado * anchoRedondeado * precioBase) / 10;
    subtotal = precioUnitario * cantidad;
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

async function getPublicProductList() {
  const sql = `
    SELECT id, nombre, tipo, descripcion, imagen_url, unidad_medida, precio_base
    FROM productos
    WHERE activo = 1 AND stock > 0
    ORDER BY id ASC
  `;
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
      routes: ['/api/auth/*', '/api/productos', '/api/productos/publicos', '/api/cotizaciones', '/api/pedidos', '/api/admin/*', '/api-docs'],
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
      const aceptaPoliticaDatos = body.aceptaPoliticaDatos === true;
      const aceptaTerminos = body.aceptaTerminos === true;

      if (!nombre || !email || !password) {
        return sendJSON(res, 400, { error: 'Nombre, email y contraseña son obligatorios' });
      }
      if (!aceptaPoliticaDatos || !aceptaTerminos) {
        return sendJSON(res, 400, { error: 'Debes aceptar la política de tratamiento de datos y los términos y condiciones' });
      }
      if (process.env.NODE_ENV !== 'test') {
        await ensureConsentColumns();
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendJSON(res, 400, { error: 'El formato del correo no es válido' });
      }

      if (password.length < 6) {
        return sendJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      const domain = email.split('@')[1];
      try {
        const mxRecords = await require('dns').promises.resolveMx(domain);
        if (!mxRecords || mxRecords.length === 0) {
           return sendJSON(res, 400, { error: 'El dominio del correo no es válido (no recibe correos)' });
        }
      } catch (err) {
        return sendJSON(res, 400, { error: 'El dominio del correo no existe o no es válido' });
      }
      const existing = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (Array.isArray(existing) && existing.length > 0) {
        return sendJSON(res, 409, { error: 'El correo ya está registrado' });
      }

      const hashedPassword = await hashPassword(password);
      const newUserId = crypto.randomUUID();
      await query(
        'INSERT INTO usuarios (id, nombre, email, password, telefono, direccion, rol, aprobado, politica_datos_aceptada, politica_datos_aceptada_at, terminos_aceptados, terminos_aceptados_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())',
        [newUserId, nombre, email, hashedPassword, telefono || null, direccion || null, 'usuario', true, true, true]
      );

      return sendJSON(res, 201, { message: 'Usuario registrado correctamente' });
    }

    // ===== LOGIN =====
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const ip = getClientIp(req);
      const rateCheck = checkRate('login', ip, body?.email || '');
      if (!rateCheck.allowed) {
        return sendJSON(res, 429, rateLimitError('login'));
      }

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

      const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
      res.setHeader('Set-Cookie', createSessionCookies(sid));

      return sendJSON(res, 200, {
        message: 'Inicio de sesion exitoso',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    }

    // ===== GOOGLE LOGIN / REGISTER =====
    if (pathname === '/api/auth/google' && method === 'POST') {
      const body = await parseBody(req);
      const ip = getClientIp(req);
      const rateCheck = checkRate('google', ip, '');
      if (!rateCheck.allowed) {
        return sendJSON(res, 429, rateLimitError('google'));
      }

      const credential = body.credential;

      if (!credential) {
        return sendJSON(res, 400, { error: 'Token de Google requerido' });
      }

      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = sanitizeEmail(payload.email);
        const name = sanitizeString(payload.name);
        const googleId = sanitizeString(payload.sub);

        await ensureGoogleIdColumn();

        let userRows = await query('SELECT * FROM usuarios WHERE google_id = ?', [googleId]);
        let user;

        if (!Array.isArray(userRows) || userRows.length === 0) {
          // No existe con google_id: intentar ligar por email (cuenta existente creada con contraseña)
          userRows = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
          if (Array.isArray(userRows) && userRows.length > 0) {
            await query('UPDATE usuarios SET google_id = ? WHERE id = ?', [googleId, userRows[0].id]);
          } else {
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await hashPassword(randomPassword);
            const newUserId = crypto.randomUUID();
            await query(
              'INSERT INTO usuarios (id, nombre, email, password, telefono, direccion, rol, aprobado, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [newUserId, name, email, hashedPassword, null, null, 'usuario', true, googleId]
            );
          }
          userRows = await query('SELECT * FROM usuarios WHERE google_id = ?', [googleId]);
        }

        user = userRows[0];

        if (!user.activo) {
          return sendJSON(res, 403, { error: 'Cuenta inactiva' });
        }
        if (!user.aprobado) {
          return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
        }

        const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
        res.setHeader('Set-Cookie', createSessionCookies(sid));

        return sendJSON(res, 200, {
          message: 'Inicio de sesion exitoso con Google',
          user: {
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            rol: user.rol
          }
        });
      } catch (error) {
        console.error('Error verifying Google Token:', error);
        return sendJSON(res, 401, { error: 'Token de Google inválido' });
      }
    }

    // ===== FORGOT PASSWORD =====
    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      const ip = getClientIp(req);
      const rateCheck = checkRate('forgot', ip, '');
      if (!rateCheck.allowed) {
        return sendJSON(res, 429, rateLimitError('forgot'));
      }

      const email = sanitizeEmail(body.email);

      if (!email) {
        return sendJSON(res, 400, { error: 'El correo es obligatorio' });
      }

      const errorDominio = await validarDominioEmail(email);
      if (errorDominio) {
        return sendJSON(res, 400, { error: errorDominio });
      }

      await ensurePasswordResetColumns();

      const rows = await query('SELECT id, nombre, email FROM usuarios WHERE email = ?', [email]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, {
          error: 'No encontramos una cuenta registrada con este correo',
        });
      }

      const user = rows[0];
      const token = createPasswordResetToken();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await query(
        'UPDATE usuarios SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
        [token, expiresAt, user.id]
      );

      try {
        await sendPasswordResetEmail({
          to: user.email,
          token,
          frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        return sendJSON(res, 500, {
          error: 'No se pudo enviar el correo. Revisa SMTP_USER, SMTP_PASS y el servidor de correo.',
        });
      }

      return sendJSON(res, 200, {
        message: 'Hemos enviado instrucciones para recuperar tu contraseña a tu correo.',
      });
    }

    // ===== RESET PASSWORD =====
    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      const token = sanitizeString(body.token || '');
      const password = sanitizeString(body.password || '');

      if (!token || !password) {
        return sendJSON(res, 400, { error: 'El token y la nueva contraseña son obligatorios' });
      }

      if (password.length < 6) {
        return sendJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      await ensurePasswordResetColumns();

      const rows = await query(
        'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expires_at > NOW() LIMIT 1',
        [token]
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 400, { error: 'El enlace de recuperación es inválido o ha expirado' });
      }

      const hashedPassword = await hashPassword(password);
      await query(
        'UPDATE usuarios SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
        [hashedPassword, rows[0].id]
      );

      return sendJSON(res, 200, { message: 'Contraseña actualizada correctamente' });
    }

    // ===== LOGOUT =====
    if (pathname === '/api/auth/logout' && method === 'POST') {
      const cookies = parseCookies(req.headers.cookie || '');
      if (cookies.sid) {
        deleteSession(cookies.sid);
      }
      res.setHeader('Set-Cookie', clearCookies());
      return sendJSON(res, 200, { message: 'Sesión cerrada' });
    }

    // ===== REFRESH (renovar sesión) =====
    if (pathname === '/api/auth/refresh' && method === 'POST') {
      const cookies = parseCookies(req.headers.cookie || '');
      const session = getSession(cookies.sid);
      if (!session) {
        return sendJSON(res, 401, { error: 'No session found' });
      }

      const userRows = await query('SELECT id, rol, nombre, email, activo, aprobado FROM usuarios WHERE id = ?', [session.userId]);
      if (!Array.isArray(userRows) || userRows.length === 0) {
        deleteSession(cookies.sid);
        return sendJSON(res, 401, { error: 'Usuario no encontrado' });
      }

      const user = userRows[0];
      if (!user.activo) return sendJSON(res, 403, { error: 'Cuenta inactiva' });
      if (!user.aprobado) return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });

      deleteSession(cookies.sid);
      const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
      res.setHeader('Set-Cookie', createSessionCookies(sid));

      return sendJSON(res, 200, {
        message: 'Sesión renovada correctamente',
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
    }

    // ===== SESSION CHECK (para middleware del frontend) =====
    if (pathname === '/api/auth/session' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No sesión activa' });
      }
      return sendJSON(res, 200, { authenticated: true, rol: userData.rol });
    }

    // ===== GET ME =====
    if (pathname === '/api/auth/me' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const rows = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, activo, ultimo_acceso FROM usuarios WHERE id = ?', [userData.id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 401, { error: 'Usuario no encontrado' });
      }

      const user = rows[0];
      if (!user.activo) {
        return sendJSON(res, 403, { error: 'Tu cuenta está desactivada' });
      }
      if (!user.aprobado) {
        return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
      }

      // No exponer activo en la respuesta (dato interno)
      const { activo: _activo, ...safeUser } = user;
      return sendJSON(res, 200, safeUser);
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

      const errorDominio = await validarDominioEmail(email);
      if (errorDominio) {
        return sendJSON(res, 400, { error: errorDominio });
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

    // ===== PRODUCTOS PÚBLICOS (Solo lectura, sin stock ni datos internos) =====
    if (pathname === '/api/productos/publicos' && method === 'GET') {
      const productos = await getPublicProductList();
      return sendJSON(res, 200, productos);
    }

    // ===== ADMIN ROUTES =====
    // Todas las rutas /api/admin/* quedan protegidas aquí, en un único punto.
    // El rol de admin se asigna externamente (DB / panel interno); esta API
    // nunca permite que un usuario se autoasigne o modifique su propio rol.
    const adminPath = pathname.startsWith('/api/admin');
    const parts = extractRouteParts(pathname);

    // Control de autorización estricto en backend: Cualquier ruta /api/admin exige token válido y rol admin
    if (adminPath) {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) {
        return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      }
    }

    // ===== CONTENIDO PÚBLICO DE LA LANDING =====
    if (pathname === '/api/encuestas/destacadas' && method === 'GET') {
      const encuestas = await query(`
        SELECT e.id, e.calificacion, e.comentario, e.fecha_respuesta, u.nombre
        FROM encuestas_satisfaccion e
        INNER JOIN usuarios u ON u.id = e.usuario_id
        WHERE e.calificacion > 4
        ORDER BY e.fecha_respuesta DESC
      `);
      return sendJSON(res, 200, Array.isArray(encuestas) ? encuestas.map(formatNumericRow) : []);
    }

    if (pathname === '/api/proyectos' && method === 'GET') {
      const proyectos = await query(`
        SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden
        FROM proyectos_destacados
        WHERE activo = 1
        ORDER BY orden ASC, fecha_creacion DESC
      `);
      return sendJSON(res, 200, Array.isArray(proyectos) ? proyectos.map(formatNumericRow) : []);
    }

    if (parts[0] === 'api' && parts[1] === 'proyectos' && parts[2] && method === 'GET') {
      const slug = sanitizeString(decodeURIComponent(parts[2]));
      const proyectos = await query(`
        SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden
        FROM proyectos_destacados
        WHERE slug = ? AND activo = 1
        LIMIT 1
      `, [slug]);

      if (!Array.isArray(proyectos) || proyectos.length === 0) {
        return sendJSON(res, 404, { error: 'Proyecto no encontrado' });
      }

      return sendJSON(res, 200, formatNumericRow(proyectos[0]));
    }

    // ===== ADMIN PRODUCTOS =====
    if (pathname === '/api/admin/productos' && method === 'GET') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const productos = await getProductList(false);
      return sendJSON(res, 200, productos);
    }

    if (pathname === '/api/admin/productos' && method === 'POST') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const body = await parseBody(req);
      const nombre = sanitizeString(body.nombre || '');
      const descripcion = sanitizeString(body.descripcion || '');
      const tipo = sanitizeString(body.tipo || '');
      const unidad_medida = sanitizeString(body.unidad_medida || '');
      const precio_base = Number(body.precio_base);
      const imagen_url = sanitizeString(body.imagen_url || '');
      const stock = Number(body.stock);
      const activo = body.activo === false ? 0 : 1;

      if (!nombre || !tipo || !unidad_medida) {
        return sendJSON(res, 400, { error: 'Faltan campos requeridos para crear el producto' });
      }
      if (Number.isNaN(precio_base) || precio_base <= 0) {
        return sendJSON(res, 400, { error: 'El precio debe ser un número mayor a cero' });
      }
      if (Number.isNaN(stock) || stock < 0) {
        return sendJSON(res, 400, { error: 'El stock debe ser un número mayor o igual a cero' });
      }

      const result = await query(
        'INSERT INTO productos (nombre, descripcion, tipo, unidad_medida, precio_base, imagen_url, stock, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, descripcion || null, tipo, unidad_medida, precio_base, imagen_url || null, stock, activo]
      );

      return sendJSON(res, 201, { message: 'Producto creado', id: result.insertId });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'productos' && parts[3] && (method === 'PATCH' || method === 'DELETE')) {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID de producto inválido' });
      }

      try {
        // Verificar existencia del producto antes de operar
        const existing = await query('SELECT id FROM productos WHERE id = ?', [id]);
        if (!Array.isArray(existing) || existing.length === 0) {
          return sendJSON(res, 404, { error: 'Producto no encontrado' });
        }

        if (method === 'PATCH') {
          const body = await parseBody(req);
          const rawPrecio = body.precio_base !== undefined ? Number(body.precio_base) : undefined;
          const rawStock = body.stock !== undefined ? Number(body.stock) : undefined;

          if (rawPrecio !== undefined && (Number.isNaN(rawPrecio) || rawPrecio <= 0)) {
            return sendJSON(res, 400, { error: 'El precio debe ser un número mayor a cero' });
          }
          if (rawStock !== undefined && (Number.isNaN(rawStock) || rawStock < 0)) {
            return sendJSON(res, 400, { error: 'El stock debe ser un número mayor o igual a cero' });
          }

          const updates = {
            nombre: body.nombre ? sanitizeString(body.nombre) : undefined,
            descripcion: body.descripcion ? sanitizeString(body.descripcion) : undefined,
            tipo: body.tipo ? sanitizeString(body.tipo) : undefined,
            unidad_medida: body.unidad_medida ? sanitizeString(body.unidad_medida) : undefined,
            precio_base: rawPrecio,
            imagen_url: body.imagen_url ? sanitizeString(body.imagen_url) : undefined,
            stock: rawStock,
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
      } catch (err) {
        // Re-lanzar errores de JSON inválido para que los maneje el catch global (→ HTTP 400)
        if (err.message === 'Invalid JSON body' || err.status === 400) {
          throw err;
        }
        console.error('Error en operación de producto:', err.message || err);
        return sendJSON(res, 500, { error: 'Error interno al procesar el producto' });
      }
    }

    // ===== ADMIN PROYECTOS DESTACADOS =====
    if (pathname === '/api/admin/proyectos' && method === 'GET') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const proyectos = await query(`
        SELECT id, titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo, fecha_creacion, fecha_actualizacion
        FROM proyectos_destacados
        ORDER BY orden ASC, fecha_creacion DESC
      `);
      return sendJSON(res, 200, Array.isArray(proyectos) ? proyectos.map(formatNumericRow) : []);
    }

    if (pathname === '/api/admin/proyectos' && method === 'POST') {
      const body = await parseBody(req);
      const titulo = sanitizeString(body.titulo || '');
      const slug = createProjectSlug(body.slug || titulo);
      const resumen = sanitizeString(body.resumen || '');
      const descripcion = sanitizeString(body.descripcion || '');
      const imagenUrl = sanitizeString(body.imagen_url || '');
      const tecnologias = sanitizeString(body.tecnologias || '');
      const orden = Number(body.orden ?? 0);
      const activo = body.activo === false ? 0 : 1;

      if (!titulo || !slug || !resumen || !imagenUrl || !Number.isInteger(orden)) {
        return sendJSON(res, 400, { error: 'Título, resumen, imagen y orden válido son obligatorios' });
      }

      const existentes = await query('SELECT id FROM proyectos_destacados WHERE slug = ?', [slug]);
      if (Array.isArray(existentes) && existentes.length > 0) {
        return sendJSON(res, 409, { error: 'Ya existe un proyecto con ese enlace (slug)' });
      }

      const result = await query(`
        INSERT INTO proyectos_destacados (titulo, slug, resumen, descripcion, imagen_url, tecnologias, orden, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [titulo, slug, resumen, descripcion || null, imagenUrl, tecnologias || null, orden, activo]);

      return sendJSON(res, 201, { message: 'Proyecto creado', id: result.insertId });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'proyectos' && parts[3] && method === 'PATCH') {
      const id = Number(parts[3]);
      if (!Number.isInteger(id) || id < 1) {
        return sendJSON(res, 400, { error: 'ID de proyecto inválido' });
      }

      const body = await parseBody(req);
      const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
      const updates = {};

      if (has('titulo')) {
        const titulo = sanitizeString(body.titulo);
        if (!titulo) return sendJSON(res, 400, { error: 'El título es obligatorio' });
        updates.titulo = titulo;
      }
      if (has('slug')) {
        const slug = createProjectSlug(body.slug);
        if (!slug) return sendJSON(res, 400, { error: 'El enlace del proyecto es obligatorio' });
        updates.slug = slug;
      }
      if (has('resumen')) {
        const resumen = sanitizeString(body.resumen);
        if (!resumen) return sendJSON(res, 400, { error: 'El resumen es obligatorio' });
        updates.resumen = resumen;
      }
      if (has('descripcion')) updates.descripcion = sanitizeString(body.descripcion) || null;
      if (has('imagen_url')) {
        const imagenUrl = sanitizeString(body.imagen_url);
        if (!imagenUrl) return sendJSON(res, 400, { error: 'La imagen es obligatoria' });
        updates.imagen_url = imagenUrl;
      }
      if (has('tecnologias')) updates.tecnologias = sanitizeString(body.tecnologias) || null;
      if (has('orden')) {
        const orden = Number(body.orden);
        if (!Number.isInteger(orden)) return sendJSON(res, 400, { error: 'El orden debe ser un número entero' });
        updates.orden = orden;
      }
      if (has('activo')) updates.activo = body.activo ? 1 : 0;

      const updateFields = Object.keys(updates);
      if (updateFields.length === 0) {
        return sendJSON(res, 400, { error: 'No hay datos para actualizar' });
      }

      if (updates.slug) {
        const existentes = await query('SELECT id FROM proyectos_destacados WHERE slug = ? AND id != ?', [updates.slug, id]);
        if (Array.isArray(existentes) && existentes.length > 0) {
          return sendJSON(res, 409, { error: 'Ya existe un proyecto con ese enlace (slug)' });
        }
      }

      const params = updateFields.map((field) => updates[field]);
      params.push(id);
      const result = await query(`UPDATE proyectos_destacados SET ${updateFields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, params);
      if (!result.affectedRows) {
        return sendJSON(res, 404, { error: 'Proyecto no encontrado' });
      }

      return sendJSON(res, 200, { message: 'Proyecto actualizado' });
    }

    // ===== ADMIN COTIZACIONES =====
    if (pathname === '/api/admin/cotizaciones' && method === 'GET') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const pedidos = await query(`
        SELECT
          p.*,
          u.nombre AS usuario_nombre,
          u.email AS usuario_email,
          c.nombre_cliente
        FROM pedidos p
        LEFT JOIN usuarios u ON u.id = p.usuario_id
        LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
        ORDER BY p.fecha_pedido DESC
      `);
      return sendJSON(res, 200, Array.isArray(pedidos) ? pedidos.map(formatNumericRow) : []);
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'pedidos' && parts[3] && method === 'PATCH') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const id = Number(parts[3]);
      if (Number.isNaN(id)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }

      const pedidoRows = await query('SELECT * FROM pedidos WHERE id = ?', [id]);
      if (!Array.isArray(pedidoRows) || pedidoRows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedidoActual = formatNumericRow(pedidoRows[0]);

      const body = await parseBody(req);
      const nuevoEstado = body.estado ? sanitizeString(body.estado) : '';
      const nuevoPago = body.pago ? sanitizeString(body.pago) : '';
      const fechaEntrega = body.fecha_entrega ? sanitizeString(body.fecha_entrega) : '';

      if (nuevoEstado === 'listo' && !fechaEntrega && !pedidoActual.fecha_entrega) {
        return sendJSON(res, 400, { error: 'Debe indicar la fecha de entrega al marcar el pedido como listo' });
      }

      if (nuevoEstado === 'entregado') {
        const fechaFinal = fechaEntrega || pedidoActual.fecha_entrega;
        if (!fechaFinal) {
          return sendJSON(res, 400, { error: 'No se puede marcar como entregado sin fecha de entrega' });
        }
      }

      const updates = {};
      if (nuevoEstado) updates.estado = nuevoEstado;
      if (nuevoPago) updates.pago = nuevoPago;
      if (fechaEntrega) updates.fecha_entrega = fechaEntrega;

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

      if (nuevoEstado && nuevoEstado !== pedidoActual.estado) {
        const uRows = await query('SELECT u.email, c.email_cliente FROM pedidos p LEFT JOIN usuarios u ON u.id = p.usuario_id LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id WHERE p.id = ?', [id]);
        if (Array.isArray(uRows) && uRows.length > 0) {
          const emailToSend = uRows[0].email_cliente || uRows[0].email;
          notifyOrderStateChange(emailToSend, id, nuevoEstado);
        }
      }

      return sendJSON(res, 200, { message: 'Pedido actualizado' });
    }

    if (parts[0] === 'api' && parts[1] === 'admin' && parts[2] === 'pedidos' && parts[3] && parts[4] === 'pdf' && method === 'GET') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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

      const prodRows = await query('SELECT nombre, stock FROM productos WHERE id = ?', [producto_id]);
      const admins = await query("SELECT email FROM usuarios WHERE rol = 'admin' AND activo = 1");
      if (Array.isArray(prodRows) && prodRows.length > 0 && Array.isArray(admins) && admins.length > 0) {
        notifyStockMovement(admins.map(a => a.email), prodRows[0].nombre, cantidad, tipo_movimiento, prodRows[0].stock);
      }

      return sendJSON(res, 201, { message: 'Movimiento registrado' });
    }

    // ===== ADMIN USUARIOS =====
    if (pathname === '/api/admin/usuarios' && method === 'GET') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      const usuarios = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, ultimo_acceso FROM usuarios ORDER BY fecha_registro DESC');
      return sendJSON(res, 200, Array.isArray(usuarios) ? usuarios.map(formatNumericRow) : []);
    }

    if (pathname === '/api/admin/usuarios' && method === 'PATCH') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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

      const MEDIDA_MAXIMA_CM = 250;
      const esCelularColombia = (phone) => {
        const digitos = String(phone || '').replace(/\D/g, '');
        return digitos.length === 10 ? /^3\d{9}$/.test(digitos) : /^573\d{9}$/.test(digitos);
      };
      if (!esCelularColombia(cliente.telefono)) {
        return sendJSON(res, 400, { error: 'Ingresa un número de celular válido (por ejemplo, 3001234567)' });
      }

      for (const { item, product } of quoteItems) {
        const cantidad = Number(item.cantidad);
        if (!Number.isFinite(cantidad) || cantidad < 1) {
          return sendJSON(res, 400, { error: 'Todos los productos deben tener una cantidad mayor a 0' });
        }
        const requiereLargo = ['vidrio', 'espejo', 'aluminio'].includes(product.tipo);
        const requiereAncho = ['vidrio', 'espejo'].includes(product.tipo);
        const largo = Number(item.medida_largo || NaN);
        const ancho = Number(item.medida_ancho || NaN);
        if (requiereLargo && (!Number.isFinite(largo) || largo <= 0 || largo > MEDIDA_MAXIMA_CM)) {
          return sendJSON(res, 400, { error: 'Las medidas deben ser mayores a 0 y no exceder los 250 cm por lado' });
        }
        if (requiereAncho && (!Number.isFinite(ancho) || ancho <= 0 || ancho > MEDIDA_MAXIMA_CM)) {
          return sendJSON(res, 400, { error: 'Las medidas deben ser mayores a 0 y no exceder los 250 cm por lado' });
        }
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
      if (total < MINIMUM_QUOTE_TOTAL_COP) {
        return sendJSON(res, 400, {
          error: `El valor mínimo para una cotización es de $${MINIMUM_QUOTE_TOTAL_COP.toLocaleString('es-CO')} COP`,
        });
      }
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
      const rows = await query(`
        SELECT
          p.*,
          e.id AS encuesta_id
        FROM pedidos p
        LEFT JOIN encuestas_satisfaccion e ON e.pedido_id = p.id
        WHERE p.usuario_id = ?
        ORDER BY p.fecha_pedido DESC
      `, [userData.id]);
      return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
    }

    if (pathname === '/api/pedidos' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      const body = await parseBody(req);
      const cotizacion_id = Number(body.cotizacion_id);
      if (Number.isNaN(cotizacion_id)) {
        return sendJSON(res, 400, { error: 'ID de cotización es obligatorio' });
      }
      const rows = await query('SELECT * FROM cotizaciones WHERE id = ?', [cotizacion_id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Cotización no encontrada' });
      }
      const cotizacion = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      let ownerId = cotizacion.usuario_id;
      if (!ownerId && cotizacion.email_cliente) {
        const userRows = await query('SELECT id FROM usuarios WHERE email = ?', [cotizacion.email_cliente]);
        if (Array.isArray(userRows) && userRows.length > 0) {
          ownerId = userRows[0].id;
        }
      }
      if (!ownerId) {
        ownerId = userData.id;
      }

      const result = await query(
        'INSERT INTO pedidos (cotizacion_id, usuario_id, fecha_entrega, estado, pago, total) VALUES (?, ?, ?, ?, ?, ?)',
        [cotizacion_id, ownerId, null, 'pendiente', 'pendiente', cotizacion.total]
      );
      await query('UPDATE cotizaciones SET estado = ? WHERE id = ?', ['convertida', cotizacion_id]);

      if (cotizacion.email_cliente) {
        notifyOrderCreated(cotizacion.email_cliente, result.insertId);
      } else {
        const ownerRows = await query('SELECT email FROM usuarios WHERE id = ?', [ownerId]);
        if (Array.isArray(ownerRows) && ownerRows.length > 0 && ownerRows[0].email) {
          notifyOrderCreated(ownerRows[0].email, result.insertId);
        }
      }

      return sendJSON(res, 201, { message: 'Pedido creado', id: result.insertId });
    }

    if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2] && parts[3] !== 'pdf' && method === 'GET') {
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

    // Create Stripe Checkout Session
    if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2] && parts[3] === 'create-checkout-session' && method === 'POST') {
      const pedidoId = Number(parts[2]);
      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }

      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const rows = await query('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedido = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const tipoPago = sanitizeString(body.tipo_pago || 'pagado');
      const total = Number(pedido.total);
      const amountInCop = getPaymentAmountInCop(total, pedido.pago || 'pendiente', tipoPago);
      if (!amountInCop) {
        return sendJSON(res, 400, {
          error: 'La modalidad de pago no está disponible para el estado actual del pedido',
        });
      }
      const unitAmount = toStripeCopAmount(amountInCop);

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecret) {
        return sendJSON(res, 500, { error: 'STRIPE_SECRET_KEY no configurada en el servidor' });
      }

      try {
        const params = new URLSearchParams();
        params.append('payment_method_types[]', 'card');
        params.append('mode', 'payment');
        params.append('line_items[0][price_data][currency]', COP_CURRENCY);
        params.append('line_items[0][price_data][product_data][name]', `Pedido #${pedidoId}`);
        params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
        params.append('line_items[0][quantity]', '1');
        params.append('success_url', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-pedidos?checkout_success=1&session_id={CHECKOUT_SESSION_ID}&pedido_id=${pedidoId}&tipo_pago=${tipoPago}`);
        params.append('cancel_url', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-pedidos?checkout_cancel=1&pedido_id=${pedidoId}&tipo_pago=${tipoPago}`);
        params.append(`metadata[pedido_id]`, String(pedidoId));
        params.append(`metadata[tipo_pago]`, tipoPago);
        params.append(`metadata[pago_previo]`, pedido.pago || 'pendiente');
        params.append(`metadata[monto_cop]`, String(amountInCop));
        params.append(`payment_intent_data[metadata][pedido_id]`, String(pedidoId));
        params.append(`payment_intent_data[metadata][tipo_pago]`, tipoPago);

        const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeSecret}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Idempotency-Key': `pedido-${pedidoId}-${pedido.pago || 'pendiente'}-${tipoPago}`,
          },
          body: params.toString()
        });

        let data = null;
        let textBody = null;
        try {
          data = await stripeRes.json();
        } catch (e) {
          try {
            textBody = await stripeRes.text();
          } catch (ee) {
            textBody = null;
          }
        }
        if (!stripeRes.ok) {
          console.error('Error creating Stripe session', { status: stripeRes.status, body: data || textBody });
          if (data && data.error && data.error.code === 'amount_too_small') {
            return sendJSON(res, 400, {
              error: 'No se pudo crear la sesión de Stripe',
              status: stripeRes.status,
              friendly: `El monto de $${amountInCop.toLocaleString('es-CO')} COP es demasiado pequeño para procesar con Stripe.`,
            });
          }
          return sendJSON(res, 400, { error: 'No se pudo crear la sesión de Stripe', status: stripeRes.status });
        }

        return sendJSON(res, 200, { message: 'Stripe session creada', session: data, amount_cop: amountInCop });
      } catch (err) {
        console.error('Error creando Stripe session:', err);
        return sendJSON(res, 500, { error: 'Error creando la sesión de Stripe' });
      }
    }

    if (parts[0] === 'api' && parts[1] === 'pedidos' && parts[2] && parts[3] === 'pago-completado' && method === 'POST') {
      const pedidoId = Number(parts[2]);
      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'ID de pedido inválido' });
      }
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const stripeSessionId = sanitizeString(body.stripe_session_id || '');
      const tipoPago = sanitizeString(body.tipo_pago || ''); // 'anticipo' o 'pagado'

      if (!stripeSessionId || !['anticipo', 'pagado'].includes(tipoPago)) {
        return sendJSON(res, 400, { error: 'Datos de pago faltantes o inválidos' });
      }

      const rows = await query('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }
      const pedido = formatNumericRow(rows[0]);
      if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      if (pedido.pago === 'pagado') {
        return sendJSON(res, 400, { error: 'El pedido ya se encuentra totalmente pagado' });
      }

      try {
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
          return sendJSON(res, 500, { error: 'STRIPE_SECRET_KEY no configurada en el servidor' });
        }

        const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}?expand[]=payment_intent`, {
          headers: {
            'Authorization': `Bearer ${stripeSecret}`,
          }
        });

        if (!stripeRes.ok) {
          const errBody = await stripeRes.text().catch(() => null);
          console.error('Error verifying Stripe session', errBody);
          return sendJSON(res, 400, { error: 'No se pudo verificar la sesión de Stripe' });
        }

        const stripeData = await stripeRes.json();
        const paymentIntent = typeof stripeData.payment_intent === 'object' ? stripeData.payment_intent : null;

        const paid = stripeData.payment_status === 'paid' || (paymentIntent && paymentIntent.status === 'succeeded');
        if (!paid) {
          return sendJSON(res, 400, { error: 'La transacción no está aprobada' });
        }

        const metadata = stripeData.metadata || {};
        if (
          stripeData.currency !== COP_CURRENCY ||
          Number(metadata.pedido_id) !== pedidoId ||
          metadata.tipo_pago !== tipoPago ||
          metadata.pago_previo !== (pedido.pago || 'pendiente')
        ) {
          return sendJSON(res, 400, { error: 'La sesión de pago no corresponde a este pedido' });
        }

        const amountReceived = stripeData.amount_total || (paymentIntent && paymentIntent.amount) || 0;
        const total = Number(pedido.total);
        const amountInCop = getPaymentAmountInCop(total, pedido.pago || 'pendiente', tipoPago);
        const expectedAmount = amountInCop ? toStripeCopAmount(amountInCop) : null;
        if (amountReceived !== expectedAmount) {
          console.warn(`Discrepancia en monto Stripe: esperado ${expectedAmount}, recibido ${amountReceived}`);
          return sendJSON(res, 400, { error: 'El monto recibido no corresponde al pago del pedido' });
        }

        const nuevoEstado = pedido.estado === 'pendiente' ? 'en_proceso' : pedido.estado;
        await query('UPDATE pedidos SET pago = ?, estado = ? WHERE id = ?', [tipoPago, nuevoEstado, pedidoId]);

        // Send Email to Admins
        const admins = await query("SELECT email FROM usuarios WHERE rol = 'admin' AND activo = 1");
        if (Array.isArray(admins) && admins.length > 0) {
          await notifyPaymentReceived(admins.map(a => a.email), pedidoId, amountInCop, tipoPago === 'anticipo');
        }

        return sendJSON(res, 200, { message: 'Pago registrado correctamente', pago: tipoPago, estado: nuevoEstado });
      } catch (err) {
        console.error('Error al procesar el pago Stripe:', err);
        return sendJSON(res, 500, { error: 'Fallo al procesar verificación Stripe' });
      }
    }

    if (pathname === '/api/encuestas' && method === 'POST') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const body = await parseBody(req);
      const pedidoId = Number(body.pedido_id);
      const calificacion = Number(body.calificacion);
      const comentario = sanitizeString(body.comentario || '');

      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'Pedido invalido' });
      }

      if (Number.isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
        return sendJSON(res, 400, { error: 'La calificacion debe estar entre 1 y 5' });
      }

      const pedidoRows = await query(
        'SELECT id, usuario_id, estado FROM pedidos WHERE id = ?',
        [pedidoId]
      );

      if (!Array.isArray(pedidoRows) || pedidoRows.length === 0) {
        return sendJSON(res, 404, { error: 'Pedido no encontrado' });
      }

      const pedido = formatNumericRow(pedidoRows[0]);

      if (String(pedido.usuario_id) !== String(userData.id)) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }

      if (pedido.estado !== 'entregado') {
        return sendJSON(res, 400, { error: 'Solo puedes responder la encuesta cuando el pedido este entregado' });
      }

      const encuestaExistente = await query(
        'SELECT id FROM encuestas_satisfaccion WHERE pedido_id = ?',
        [pedidoId]
      );

      if (Array.isArray(encuestaExistente) && encuestaExistente.length > 0) {
        return sendJSON(res, 409, { error: 'La encuesta de este pedido ya fue respondida' });
      }

      const result = await query(
        'INSERT INTO encuestas_satisfaccion (pedido_id, usuario_id, calificacion, comentario) VALUES (?, ?, ?, ?)',
        [pedidoId, userData.id, calificacion, comentario || null]
      );

      return sendJSON(res, 201, {
        message: 'Encuesta registrada correctamente',
        id: result.insertId,
      });
    }

    if (parts[0] === 'api' && parts[1] === 'encuestas' && parts[2] === 'pedidos' && parts[3] && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }

      const pedidoId = Number(parts[3]);
      if (Number.isNaN(pedidoId)) {
        return sendJSON(res, 400, { error: 'Pedido invalido' });
      }

      const rows = await query(`
        SELECT e.*
        FROM encuestas_satisfaccion e
        INNER JOIN pedidos p ON p.id = e.pedido_id
        WHERE e.pedido_id = ? AND p.usuario_id = ?
      `, [pedidoId, userData.id]);

      return sendJSON(res, 200, {
        respondida: Array.isArray(rows) && rows.length > 0,
        encuesta: Array.isArray(rows) && rows.length > 0 ? formatNumericRow(rows[0]) : null,
      });
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

    if (pathname === '/api/agenda/dias-disponibles' && method === 'GET') {
      const userData = getUserFromRequest(req);
      if (!userData) {
        return sendJSON(res, 401, { error: 'No autorizado' });
      }
      await ensureAgendaDiasDisponiblesTable();
      const rows = await query(
        'SELECT fecha FROM agenda_dias_disponibles ORDER BY fecha ASC'
      );
      const fechas = (Array.isArray(rows) ? rows : []).map((r) => {
        const f = new Date(r.fecha);
        return Number.isNaN(f.getTime()) ? String(r.fecha).slice(0, 10) : toFechaLocalDateKey(f);
      });
      return sendJSON(res, 200, fechas);
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

      if (!TIPOS_CITA_VALIDOS.includes(tipo)) {
        return sendJSON(res, 400, { error: 'El tipo de cita seleccionado no es válido' });
      }

      const errorHorario = validarHorarioCita(fecha_cita);
      if (errorHorario) {
        return sendJSON(res, 400, { error: errorHorario });
      }

      await ensureAgendaDiasDisponiblesTable();
      const diaClave = toFechaLocalDateKey(fecha_cita);
      const diasRows = await query('SELECT id FROM agenda_dias_disponibles WHERE fecha = ?', [diaClave]);
      if (!Array.isArray(diasRows) || diasRows.length === 0) {
        return sendJSON(res, 400, {
          error: 'El administrador aún no ha habilitado esta fecha. Solo se pueden agendar citas en las fechas permitidas.',
        });
      }

      await ensureUltimaAgendaColumn();
      const userRows = await query('SELECT ultima_agenda FROM usuarios WHERE id = ?', [userData.id]);
      const ultimaAgenda = Array.isArray(userRows) && userRows.length > 0 ? userRows[0].ultima_agenda : null;
      if (ultimaAgenda) {
        const diffMs = Date.now() - new Date(ultimaAgenda).getTime();
        if (diffMs < 20 * 60 * 1000) {
          const faltandoMin = Math.ceil((20 * 60 * 1000 - diffMs) / 60000);
          return sendJSON(res, 429, {
            error: `Debes esperar ${faltandoMin} minuto(s) antes de poder agendar otra cita. Las siguientes citas solo pueden crearse cada 20 minutos.`,
          });
        }
      }

      const result = await query(
        'INSERT INTO citas_agenda (usuario_id, titulo, descripcion, fecha_cita, tipo, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userData.id, titulo, descripcion || null, fecha_cita, tipo, 'pendiente', notas || null]
      );

      await query('UPDATE usuarios SET ultima_agenda = NOW() WHERE id = ?', [userData.id]);

      if (userData.email) {
        notifyAppointment(userData.email, titulo, fecha_cita, false);
      }

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

      const uRows = await query('SELECT email FROM usuarios WHERE id = ?', [rows[0].usuario_id]);
      if (Array.isArray(uRows) && uRows.length > 0 && uRows[0].email) {
        notifyAppointment(uRows[0].email, titulo, fecha_cita, true);
      }

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
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
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

    if (pathname === '/api/admin/agenda/dias-disponibles') {
      const adminCheck = requireAdmin(req);
      if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
      await ensureAgendaDiasDisponiblesTable();

      if (method === 'GET') {
        const rows = await query(
          'SELECT fecha FROM agenda_dias_disponibles ORDER BY fecha ASC'
        );
        const fechas = (Array.isArray(rows) ? rows : []).map((r) => {
          const f = new Date(r.fecha);
          return Number.isNaN(f.getTime()) ? String(r.fecha).slice(0, 10) : toFechaLocalDateKey(f);
        });
        return sendJSON(res, 200, fechas);
      }

      if (method === 'POST') {
        const body = await parseBody(req);
        const fechaStr = String(body.fecha || '').slice(0, 10);
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaStr);
        if (!match) {
          return sendJSON(res, 400, { error: 'Fecha inválida. Usa el formato YYYY-MM-DD.' });
        }
        const fecha = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00`);
        if (Number.isNaN(fecha.getTime())) {
          return sendJSON(res, 400, { error: 'Fecha inválida.' });
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fecha.getTime() < hoy.getTime()) {
          return sendJSON(res, 400, { error: 'No puedes habilitar fechas en el pasado.' });
        }

        const dia = fecha.getDay();
        if (dia === 0 || dia === 6) {
          return sendJSON(res, 400, { error: 'Solo se permiten días de lunes a viernes.' });
        }

        try {
          await query('INSERT INTO agenda_dias_disponibles (fecha) VALUES (?)', [fechaStr]);
        } catch (error) {
          if (error && error.code === 'ER_DUP_ENTRY') {
            return sendJSON(res, 409, { error: 'Esa fecha ya está habilitada.' });
          }
          throw error;
        }
        return sendJSON(res, 201, { mensaje: 'Fecha habilitada correctamente' });
      }

      if (method === 'DELETE') {
        const body = await parseBody(req);
        const fechaStr = String(body.fecha || '').slice(0, 10);
        if (!/^(\d{4})-(\d{2})-(\d{2})$/.test(fechaStr)) {
          return sendJSON(res, 400, { error: 'Fecha inválida.' });
        }
        await query('DELETE FROM agenda_dias_disponibles WHERE fecha = ?', [fechaStr]);
        return sendJSON(res, 200, { mensaje: 'Fecha deshabilitada correctamente' });
      }

      return sendJSON(res, 405, { error: 'Método no permitido' });
    }

    return sendJSON(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    if (error.message === 'Invalid JSON body' || error.status === 400) {
      return sendJSON(res, 400, { error: 'Formato JSON inválido' });
    }
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
