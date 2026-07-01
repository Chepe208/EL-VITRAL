const http = require('http');
const { URL } = require('url');

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
  verifyToken,
} = require('./lib/auth.js');

const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

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

  if (method === 'OPTIONS') {
    setHeaders(res, 204);
    res.end();
    return;
  }

  if (pathname === '/' || pathname === '/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      message: 'EL VITRAL backend server is running',
      routes: ['/api/auth/*', '/api/productos', '/api/cotizaciones', '/api/pedidos', '/api/admin/*'],
    });
  }

  try {
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
      return sendJSON(res, 200, { message: 'Inicio de sesión exitoso' });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      res.setHeader('Set-Cookie', createExpiredCookie());
      return sendJSON(res, 200, { message: 'Sesión cerrada' });
    }

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

    if (pathname === '/api/productos' && method === 'GET') {
      const productos = await getProductList(true);
      return sendJSON(res, 200, productos);
    }

    const adminPath = pathname.startsWith('/api/admin');
    const parts = extractRouteParts(pathname);

    if (adminPath && parts.length >= 2) {
      const userData = getUserFromRequest(req);
      if (!userData || !isAdmin(userData)) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
    }

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

    if (pathname === '/api/admin/cotizaciones' && method === 'POST') {
      return sendJSON(res, 404, { error: 'Ruta no disponible' });
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

    if (pathname === '/api/admin/pedidos' && method === 'GET') {
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
      `, [Number(userData.id)]);
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
      if (!isAdmin(userData) && Number(pedido.usuario_id) !== Number(userData.id)) {
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
      if (!isAdmin(userData) && Number(pedido.usuario_id) !== Number(userData.id)) {
        return sendJSON(res, 403, { error: 'No autorizado' });
      }
      const detalles = await query(
        'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
        [pedido.cotizacion_id]
      );
      return sendPDF(res, `pedido-${pedidoId}.pdf`, (doc) => buildPedidoPdf(doc, pedido, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
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

      if (Number(pedido.usuario_id) !== Number(userData.id)) {
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
