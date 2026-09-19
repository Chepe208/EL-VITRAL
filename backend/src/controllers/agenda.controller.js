const { query } = require('../../lib/db.js');
const {
  getUserFromRequest,
  isAdmin,
  requireAdmin,
  sanitizeString,
} = require('../../lib/auth.js');
const { notifyAppointment } = require('../../lib/notifications.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');
const { validarHorarioCita, toFechaLocalDateKey } = require('../utils/validators.js');
const {
  ensureAgendaDiasDisponiblesTable,
  ensureUltimaAgendaColumn,
} = require('../services/tableInit.service.js');
const { TIPOS_CITA_VALIDOS } = require('../config/constants.js');

async function getUserAppointments(req, res) {
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

async function getAvailableDays(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  await ensureAgendaDiasDisponiblesTable();
  const rows = await query('SELECT fecha FROM agenda_dias_disponibles ORDER BY fecha ASC');
  const fechas = (Array.isArray(rows) ? rows : []).map((r) => {
    const f = new Date(r.fecha);
    return Number.isNaN(f.getTime()) ? String(r.fecha).slice(0, 10) : toFechaLocalDateKey(f);
  });
  return sendJSON(res, 200, fechas);
}

async function createAppointment(req, res) {
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

async function updateAppointment(req, res) {
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

async function deleteAppointment(req, res) {
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

async function getAdminAgenda(req, res) {
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

async function handleAdminDiasDisponibles(req, res, method) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  await ensureAgendaDiasDisponiblesTable();

  if (method === 'GET') {
    const rows = await query('SELECT fecha FROM agenda_dias_disponibles ORDER BY fecha ASC');
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

module.exports = {
  getUserAppointments,
  getAvailableDays,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAdminAgenda,
  handleAdminDiasDisponibles,
};
