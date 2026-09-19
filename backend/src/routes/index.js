const { URL } = require('url');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('../../swagger.js');

const { sendJSON, extractRouteParts } = require('../utils/http.js');
const { handleCors } = require('../middlewares/cors.middleware.js');
const { verifyAdminAccess } = require('../middlewares/admin.middleware.js');
const { handleError } = require('../middlewares/errorHandler.middleware.js');

const { handleAuthRoutes } = require('./auth.routes.js');
const { handleProductosRoutes } = require('./productos.routes.js');
const { handleProyectosRoutes } = require('./proyectos.routes.js');
const { handleCotizacionesRoutes } = require('./cotizaciones.routes.js');
const { handlePedidosRoutes } = require('./pedidos.routes.js');
const { handleInventarioRoutes } = require('./inventario.routes.js');
const { handleUsuariosRoutes } = require('./usuarios.routes.js');
const { handleEncuestasRoutes } = require('./encuestas.routes.js');
const { handleAgendaRoutes } = require('./agenda.routes.js');

const expressApp = express();
expressApp.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
}));

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  if (pathname.startsWith('/api-docs')) {
    return expressApp(req, res);
  }

  if (handleCors(req, res)) {
    return;
  }

  if (pathname === '/' || pathname === '/health') {
    return sendJSON(res, 200, {
      status: 'ok',
      message: 'EL VITRAL backend server is running',
      routes: [
        '/api/auth/*',
        '/api/productos',
        '/api/productos/publicos',
        '/api/cotizaciones',
        '/api/pedidos',
        '/api/admin/*',
        '/api-docs',
      ],
    });
  }

  try {
    const parts = extractRouteParts(pathname);

    // 1. Rutas de autenticación (públicas y de usuario)
    if (await handleAuthRoutes(req, res, pathname, method)) {
      return;
    }

    // 2. Rutas públicas de catálogo de productos
    if (pathname === '/api/productos' || pathname === '/api/productos/publicos') {
      if (await handleProductosRoutes(req, res, pathname, method, parts)) {
        return;
      }
    }

    // 3. Control de acceso para rutas administrativas /api/admin/*
    if (pathname.startsWith('/api/admin')) {
      const adminAccess = verifyAdminAccess(req, res);
      if (!adminAccess.ok) {
        return;
      }
    }

    // 4. Módulos por funcionalidad
    if (await handleEncuestasRoutes(req, res, pathname, method, parts)) {
      return;
    }

    if (await handleProyectosRoutes(req, res, pathname, method, parts)) {
      return;
    }

    if (await handleProductosRoutes(req, res, pathname, method, parts)) {
      return;
    }

    if (await handleCotizacionesRoutes(req, res, pathname, method, parts)) {
      return;
    }

    if (await handlePedidosRoutes(req, res, pathname, method, parts)) {
      return;
    }

    if (await handleInventarioRoutes(req, res, pathname, method)) {
      return;
    }

    if (await handleUsuariosRoutes(req, res, pathname, method)) {
      return;
    }

    if (await handleAgendaRoutes(req, res, pathname, method)) {
      return;
    }

    return sendJSON(res, 404, { error: 'Ruta no encontrada' });
  } catch (error) {
    return handleError(error, req, res);
  }
}

module.exports = {
  handleRequest,
  expressApp,
};
