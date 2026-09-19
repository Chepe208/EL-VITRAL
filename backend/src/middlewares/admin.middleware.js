const { requireAdmin } = require('../../lib/auth.js');
const { sendJSON } = require('../utils/http.js');

function verifyAdminAccess(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) {
    sendJSON(res, adminCheck.status, { error: adminCheck.error });
    return { ok: false, check: adminCheck };
  }
  return { ok: true, check: adminCheck };
}

module.exports = {
  verifyAdminAccess,
};
