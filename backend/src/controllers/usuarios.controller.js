const { query } = require('../../lib/db.js');
const { requireAdmin, deleteSessionsForUser, sanitizeString } = require('../../lib/auth.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');

async function getAdminUsers(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const usuarios = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, activo, ultimo_acceso FROM usuarios ORDER BY fecha_registro DESC');
  return sendJSON(res, 200, Array.isArray(usuarios) ? usuarios.map(formatNumericRow) : []);
}

async function updateAdminUser(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const body = await parseBody(req);
  const id = sanitizeString(body.id || '');
  if (!id) {
    return sendJSON(res, 400, { error: 'ID de usuario inválido' });
  }
  if (id === String(adminCheck.user.id) && (body.activo === false || body.rol === 'usuario')) {
    return sendJSON(res, 400, { error: 'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador' });
  }
  const updates = [];
  const params = [];
  if (typeof body.aprobado === 'boolean') {
    updates.push('aprobado = ?');
    params.push(body.aprobado ? 1 : 0);
  }
  if (typeof body.activo === 'boolean') {
    updates.push('activo = ?');
    params.push(body.activo ? 1 : 0);
  }
  if (body.rol !== undefined) {
    if (!['usuario', 'admin'].includes(body.rol)) {
      return sendJSON(res, 400, { error: 'Rol inválido' });
    }
    updates.push('rol = ?');
    params.push(body.rol);
  }
  if (updates.length === 0) {
    return sendJSON(res, 400, { error: 'No hay cambios para aplicar' });
  }
  params.push(id);
  const result = await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params);
  if (!result || result.affectedRows === 0) {
    return sendJSON(res, 404, { error: 'Usuario no encontrado' });
  }
  if (body.activo === false || body.aprobado === false) {
    deleteSessionsForUser(id);
  }
  return sendJSON(res, 200, { message: 'Usuario actualizado correctamente' });
}

module.exports = {
  getAdminUsers,
  updateAdminUser,
};
