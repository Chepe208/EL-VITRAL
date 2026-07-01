const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EL VITRAL API',
      version: '0.1.0',
      description: 'API documentation for EL VITRAL backend',
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa el token JWT con el formato: Bearer <token>'
        }
      }
    },
    // Nota: NO se define un `security` global aquí a propósito.
    // Cada operación en index.js declara su propio bloque `security: - bearerAuth: []`
    // solo si el endpoint realmente lo requiere. Si se pone un default global,
    // Swagger UI muestra el candado en TODAS las rutas (incluidas las públicas
    // como /api/auth/register, /api/auth/login y /api/productos), aunque el
    // backend no les exija token.
  },
  apis: ['./index.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;