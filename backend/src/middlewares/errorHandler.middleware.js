const { sendJSON } = require('../utils/http.js');

function handleError(error, req, res) {
  if (error.message === 'Invalid JSON body' || error.status === 400) {
    return sendJSON(res, 400, { error: 'Formato JSON inválido' });
  }
  console.error('Request error:', error);
  return sendJSON(res, 500, { error: 'Error interno del servidor' });
}

module.exports = {
  handleError,
};
