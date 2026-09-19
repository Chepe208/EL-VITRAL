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
          description: 'Ingresa el token JWT con el formato: Bearer <token>',
        },
      },
    },
  },
  apis: ['./src/routes/*.routes.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;