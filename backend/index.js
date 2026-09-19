require('dotenv').config();

const http = require('http');
const { handleRequest } = require('./src/routes/index.js');

const port = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    console.log(`📚 Swagger docs disponible en http://localhost:${port}/api-docs`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Error: puerto ${port} ya está en uso. Cierra el servidor que se está ejecutando en ese puerto o elige otro puerto con PORT=<otro_puerto>.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

module.exports = server;
