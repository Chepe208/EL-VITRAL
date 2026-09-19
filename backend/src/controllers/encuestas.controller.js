const { query } = require('../../lib/db.js');
const { getUserFromRequest, sanitizeString } = require('../../lib/auth.js');
const { sendJSON, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');
const { ensureSurveyTable } = require('../services/tableInit.service.js');

async function getFeaturedSurveys(req, res) {
  const encuestas = await query(`
    SELECT e.id, e.calificacion, e.comentario, e.fecha_respuesta, u.nombre
    FROM encuestas_satisfaccion e
    INNER JOIN usuarios u ON u.id = e.usuario_id
    WHERE e.calificacion > 4
    ORDER BY e.fecha_respuesta DESC
  `);
  return sendJSON(res, 200, Array.isArray(encuestas) ? encuestas.map(formatNumericRow) : []);
}

async function submitSurvey(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  const pedidoId = Number(body.pedido_id);
  const calificacion = Number(body.calificacion);
  const comentario = sanitizeString(body.comentario || '');

  if (process.env.NODE_ENV !== 'test') {
    await ensureSurveyTable();
  }

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

  if (String(pedido.usuario_id) !== String(userData.id)) {
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

async function getSurveyByOrderId(req, res, pedidoId) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

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

module.exports = {
  getFeaturedSurveys,
  submitSurvey,
  getSurveyByOrderId,
};
