const { setHeaders } = require('../utils/http.js');

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    setHeaders(res, 204);
    res.end();
    return true;
  }
  return false;
}

module.exports = {
  handleCors,
};
