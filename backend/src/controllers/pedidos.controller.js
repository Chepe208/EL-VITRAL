const crypto = require('crypto');
const { query } = require('../../lib/db.js');
const {
  getUserFromRequest,
  isAdmin,
  requireAdmin,
  sanitizeString,
} = require('../../lib/auth.js');
const {
  notifyOrderCreated,
  notifyOrderStateChange,
  notifyPaymentReceived,
} = require('../../lib/notifications.js');
const { sendJSON, sendPDF, parseBody } = require('../utils/http.js');
const { formatNumericRow } = require('../utils/formatters.js');
const { buildPedidoPdf } = require('../services/pdf.service.js');
const {
  getStripeSecret,
  getPaymentAmountInCop,
  toStripeCopAmount,
} = require('../services/pricing.service.js');
const { COP_CURRENCY } = require('../config/constants.js');

async function getUserOrders(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  const rows = await query(`
    SELECT
      p.*,
      e.id AS encuesta_id
    FROM pedidos p
    LEFT JOIN encuestas_satisfaccion e ON e.pedido_id = p.id
    WHERE p.usuario_id = ?
    ORDER BY p.fecha_pedido DESC
  `, [userData.id]);
  return sendJSON(res, 200, Array.isArray(rows) ? rows.map(formatNumericRow) : []);
}

async function createOrderFromQuote(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  const body = await parseBody(req);
  const cotizacion_id = Number(body.cotizacion_id);
  if (Number.isNaN(cotizacion_id)) {
    return sendJSON(res, 400, { error: 'ID de cotización es obligatorio' });
  }
  const rows = await query('SELECT * FROM cotizaciones WHERE id = ?', [cotizacion_id]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Cotización no encontrada' });
  }
  const cotizacion = formatNumericRow(rows[0]);
  if (!isAdmin(userData) && cotizacion.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }
  if (cotizacion.estado === 'convertida') {
    return sendJSON(res, 409, { error: 'La cotización ya fue convertida en un pedido' });
  }

  let ownerId = cotizacion.usuario_id;
  if (!ownerId && cotizacion.email_cliente) {
    const userRows = await query('SELECT id FROM usuarios WHERE email = ?', [cotizacion.email_cliente]);
    if (Array.isArray(userRows) && userRows.length > 0) {
      ownerId = userRows[0].id;
    }
  }
  if (!ownerId) {
    ownerId = userData.id;
  }

  const result = await query(
    'INSERT INTO pedidos (cotizacion_id, usuario_id, fecha_entrega, estado, pago, total) VALUES (?, ?, ?, ?, ?, ?)',
    [cotizacion_id, ownerId, null, 'pendiente', 'pendiente', cotizacion.total]
  );

  await query('UPDATE cotizaciones SET estado = ? WHERE id = ?', ['convertida', cotizacion_id]);

  const detalleRows = await query(
    'SELECT producto_id, cantidad, descripcion FROM cotizacion_detalles WHERE cotizacion_id = ?',
    [cotizacion_id]
  );
  if (Array.isArray(detalleRows)) {
    for (const detalle of detalleRows) {
      const cantidad = Number(detalle.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) continue;
      await query(
        'INSERT INTO inventario (producto_id, cantidad, tipo_movimiento, descripcion, pedido_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?)',
        [detalle.producto_id, cantidad, 'salida', `Salida por pedido #${result.insertId}: ${detalle.descripcion || 'Producto cotizado'}`, result.insertId, ownerId]
      );
      await query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, detalle.producto_id]);
    }
  }

  if (cotizacion.email_cliente) {
    notifyOrderCreated(cotizacion.email_cliente, result.insertId);
  } else {
    const ownerRows = await query('SELECT email FROM usuarios WHERE id = ?', [ownerId]);
    if (Array.isArray(ownerRows) && ownerRows.length > 0 && ownerRows[0].email) {
      notifyOrderCreated(ownerRows[0].email, result.insertId);
    }
  }

  return sendJSON(res, 201, { message: 'Pedido creado', id: result.insertId });
}

async function getOrderDetail(req, res, pedidoId) {
  if (Number.isNaN(pedidoId)) {
    return sendJSON(res, 400, { error: 'ID de pedido inválido' });
  }
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  const rows = await query(`
    SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
    FROM pedidos p
    LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
    WHERE p.id = ?
  `, [pedidoId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedido = formatNumericRow(rows[0]);
  if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [pedido.cotizacion_id]
  );
  return sendJSON(res, 200, { ...pedido, detalles: Array.isArray(detalles) ? detalles.map(formatNumericRow) : [] });
}

async function getOrderPdf(req, res, pedidoId) {
  if (Number.isNaN(pedidoId)) {
    return sendJSON(res, 400, { error: 'ID de pedido inválido' });
  }
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }
  const rows = await query(`
    SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
    FROM pedidos p
    LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
    WHERE p.id = ?
  `, [pedidoId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedido = formatNumericRow(rows[0]);
  if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [pedido.cotizacion_id]
  );
  return sendPDF(res, `pedido-${pedidoId}.pdf`, (doc) => buildPedidoPdf(doc, pedido, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
}

async function createCheckoutSession(req, res, pedidoId) {
  if (Number.isNaN(pedidoId)) {
    return sendJSON(res, 400, { error: 'ID de pedido inválido' });
  }

  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const rows = await query('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedido = formatNumericRow(rows[0]);
  if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  const tipoPago = sanitizeString(body.tipo_pago || 'pagado');
  const total = Number(pedido.total);
  const amountInCop = getPaymentAmountInCop(total, pedido.pago || 'pendiente', tipoPago);
  if (!amountInCop) {
    return sendJSON(res, 400, {
      error: 'La modalidad de pago no está disponible para el estado actual del pedido',
    });
  }
  const unitAmount = toStripeCopAmount(amountInCop);

  const stripeSecret = getStripeSecret();
  if (!stripeSecret) {
    return sendJSON(res, 500, { error: 'STRIPE_SECRET_KEY no configurada en el servidor' });
  }

  try {
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('mode', 'payment');
    params.append('line_items[0][price_data][currency]', COP_CURRENCY);
    params.append('line_items[0][price_data][product_data][name]', `Pedido #${pedidoId}`);
    params.append('line_items[0][price_data][unit_amount]', String(unitAmount));
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-pedidos?checkout_success=1&session_id={CHECKOUT_SESSION_ID}&pedido_id=${pedidoId}&tipo_pago=${tipoPago}`);
    params.append('cancel_url', `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mis-pedidos?checkout_cancel=1&pedido_id=${pedidoId}&tipo_pago=${tipoPago}`);
    params.append(`metadata[pedido_id]`, String(pedidoId));
    params.append(`metadata[tipo_pago]`, tipoPago);
    params.append(`metadata[pago_previo]`, pedido.pago || 'pendiente');
    params.append(`metadata[monto_cop]`, String(amountInCop));
    params.append(`payment_intent_data[metadata][pedido_id]`, String(pedidoId));
    params.append(`payment_intent_data[metadata][tipo_pago]`, tipoPago);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `pedido-${pedidoId}-${pedido.pago || 'pendiente'}-${tipoPago}-${crypto.randomUUID()}`,
      },
      body: params.toString(),
    });

    let data = null;
    let textBody = null;
    try {
      data = await stripeRes.json();
    } catch (e) {
      try {
        textBody = await stripeRes.text();
      } catch (ee) {
        textBody = null;
      }
    }
    if (!stripeRes.ok) {
      console.error('Error creating Stripe session', { status: stripeRes.status, body: data || textBody });
      if (data && data.error && data.error.code === 'amount_too_small') {
        return sendJSON(res, 400, {
          error: 'No se pudo crear la sesión de Stripe',
          status: stripeRes.status,
          friendly: `El monto de $${amountInCop.toLocaleString('es-CO')} COP es demasiado pequeño para procesar con Stripe.`,
        });
      }
      if (data && data.error && data.error.type === 'authentication_error') {
        return sendJSON(res, 500, {
          error: 'La configuración de Stripe no es válida en el servidor',
        });
      }
      return sendJSON(res, 400, { error: 'No se pudo crear la sesión de Stripe', status: stripeRes.status });
    }

    return sendJSON(res, 200, { message: 'Stripe session creada', session: data, amount_cop: amountInCop });
  } catch (err) {
    console.error('Error creando Stripe session:', err);
    return sendJSON(res, 500, { error: 'Error creando la sesión de Stripe' });
  }
}

async function completePayment(req, res, pedidoId) {
  if (Number.isNaN(pedidoId)) {
    return sendJSON(res, 400, { error: 'ID de pedido inválido' });
  }
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  const stripeSessionId = sanitizeString(body.stripe_session_id || '');
  const tipoPago = sanitizeString(body.tipo_pago || '');

  if (!stripeSessionId || !['anticipo', 'pagado'].includes(tipoPago)) {
    return sendJSON(res, 400, { error: 'Datos de pago faltantes o inválidos' });
  }

  const rows = await query('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedido = formatNumericRow(rows[0]);
  if (!isAdmin(userData) && pedido.usuario_id !== userData.id) {
    return sendJSON(res, 403, { error: 'No autorizado' });
  }

  if (pedido.pago === 'pagado') {
    return sendJSON(res, 400, { error: 'El pedido ya se encuentra totalmente pagado' });
  }

  try {
    const stripeSecret = getStripeSecret();
    if (!stripeSecret) {
      return sendJSON(res, 500, { error: 'STRIPE_SECRET_KEY no configurada en el servidor' });
    }

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeSessionId}?expand[]=payment_intent`, {
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
      },
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text().catch(() => null);
      console.error('Error verifying Stripe session', errBody);
      return sendJSON(res, 400, { error: 'No se pudo verificar la sesión de Stripe' });
    }

    const stripeData = await stripeRes.json();
    const paymentIntent = typeof stripeData.payment_intent === 'object' ? stripeData.payment_intent : null;

    const paid = stripeData.payment_status === 'paid' || (paymentIntent && paymentIntent.status === 'succeeded');
    if (!paid) {
      return sendJSON(res, 400, { error: 'La transacción no está aprobada' });
    }

    const metadata = stripeData.metadata || {};
    if (
      stripeData.currency !== COP_CURRENCY ||
      Number(metadata.pedido_id) !== pedidoId ||
      metadata.tipo_pago !== tipoPago ||
      metadata.pago_previo !== (pedido.pago || 'pendiente')
    ) {
      return sendJSON(res, 400, { error: 'La sesión de pago no corresponde a este pedido' });
    }

    const amountReceived = stripeData.amount_total || (paymentIntent && paymentIntent.amount) || 0;
    const total = Number(pedido.total);
    const amountInCop = getPaymentAmountInCop(total, pedido.pago || 'pendiente', tipoPago);
    const expectedAmount = amountInCop ? toStripeCopAmount(amountInCop) : null;
    if (amountReceived !== expectedAmount) {
      console.warn(`Discrepancia en monto Stripe: esperado ${expectedAmount}, recibido ${amountReceived}`);
      return sendJSON(res, 400, { error: 'El monto recibido no corresponde al pago del pedido' });
    }

    const nuevoEstado = pedido.estado === 'pendiente' ? 'en_proceso' : pedido.estado;
    await query('UPDATE pedidos SET pago = ?, estado = ? WHERE id = ?', [tipoPago, nuevoEstado, pedidoId]);

    const admins = await query("SELECT email FROM usuarios WHERE rol = 'admin' AND activo = 1");
    if (Array.isArray(admins) && admins.length > 0) {
      await notifyPaymentReceived(admins.map((a) => a.email), pedidoId, amountInCop, tipoPago === 'anticipo');
    }

    return sendJSON(res, 200, { message: 'Pago registrado correctamente', pago: tipoPago, estado: nuevoEstado });
  } catch (err) {
    console.error('Error al procesar el pago Stripe:', err);
    return sendJSON(res, 500, { error: 'Fallo al procesar verificación Stripe' });
  }
}

async function getAdminOrders(req, res) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });
  const pedidos = await query(`
    SELECT
      p.*,
      u.nombre AS usuario_nombre,
      u.email AS usuario_email,
      c.nombre_cliente
    FROM pedidos p
    LEFT JOIN usuarios u ON u.id = p.usuario_id
    LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
    ORDER BY p.fecha_pedido DESC
  `);
  return sendJSON(res, 200, Array.isArray(pedidos) ? pedidos.map(formatNumericRow) : []);
}

async function updateAdminOrder(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) {
    return sendJSON(res, 400, { error: 'ID de pedido inválido' });
  }

  const pedidoRows = await query('SELECT * FROM pedidos WHERE id = ?', [id]);
  if (!Array.isArray(pedidoRows) || pedidoRows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedidoActual = formatNumericRow(pedidoRows[0]);

  const body = await parseBody(req);
  const nuevoEstado = body.estado ? sanitizeString(body.estado) : '';
  const nuevoPago = body.pago ? sanitizeString(body.pago) : '';
  const fechaEntrega = body.fecha_entrega ? sanitizeString(body.fecha_entrega) : '';

  if (nuevoEstado === 'listo' && !fechaEntrega && !pedidoActual.fecha_entrega) {
    return sendJSON(res, 400, { error: 'Debe indicar la fecha de entrega al marcar el pedido como listo' });
  }

  if (nuevoEstado === 'entregado') {
    const fechaFinal = fechaEntrega || pedidoActual.fecha_entrega;
    if (!fechaFinal) {
      return sendJSON(res, 400, { error: 'No se puede marcar como entregado sin fecha de entrega' });
    }
  }

  const updates = {};
  if (nuevoEstado) updates.estado = nuevoEstado;
  if (nuevoPago) updates.pago = nuevoPago;
  if (fechaEntrega) updates.fecha_entrega = fechaEntrega;

  const fields = [];
  const params = [];
  Object.entries(updates).forEach(([key, value]) => {
    if (value) {
      fields.push(`${key} = ?`);
      params.push(value);
    }
  });

  if (fields.length === 0) {
    return sendJSON(res, 400, { error: 'No hay cambios para guardar' });
  }

  params.push(id);
  await query(`UPDATE pedidos SET ${fields.join(', ')} WHERE id = ?`, params);

  if (nuevoEstado && nuevoEstado !== pedidoActual.estado) {
    const uRows = await query('SELECT u.email, c.email_cliente FROM pedidos p LEFT JOIN usuarios u ON u.id = p.usuario_id LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id WHERE p.id = ?', [id]);
    if (Array.isArray(uRows) && uRows.length > 0) {
      const emailToSend = uRows[0].email_cliente || uRows[0].email;
      notifyOrderStateChange(emailToSend, id, nuevoEstado);
    }
  }

  return sendJSON(res, 200, { message: 'Pedido actualizado' });
}

async function getAdminOrderPdf(req, res, id) {
  const adminCheck = requireAdmin(req);
  if (!adminCheck.ok) return sendJSON(res, adminCheck.status, { error: adminCheck.error });

  if (Number.isNaN(id)) {
    return sendJSON(res, 400, { error: 'ID inválido' });
  }
  const rows = await query(`
    SELECT p.*, c.nombre_cliente, c.email_cliente, c.telefono_cliente, c.direccion_cliente
    FROM pedidos p
    LEFT JOIN cotizaciones c ON c.id = p.cotizacion_id
    WHERE p.id = ?
  `, [id]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, { error: 'Pedido no encontrado' });
  }
  const pedido = formatNumericRow(rows[0]);
  const detalles = await query(
    'SELECT cd.*, p.nombre AS producto_nombre, p.tipo AS producto_tipo FROM cotizacion_detalles cd LEFT JOIN productos p ON p.id = cd.producto_id WHERE cd.cotizacion_id = ?',
    [pedido.cotizacion_id]
  );
  return sendPDF(res, `pedido-${id}.pdf`, (doc) => buildPedidoPdf(doc, pedido, Array.isArray(detalles) ? detalles.map(formatNumericRow) : []));
}

module.exports = {
  getUserOrders,
  createOrderFromQuote,
  getOrderDetail,
  getOrderPdf,
  createCheckoutSession,
  completePayment,
  getAdminOrders,
  updateAdminOrder,
  getAdminOrderPdf,
};
