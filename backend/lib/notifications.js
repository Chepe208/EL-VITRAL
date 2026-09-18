require('dotenv').config();
const nodemailer = require('nodemailer');
const { sendEmail } = require('./email');

function getTransporter() {
  if (process.env.RESEND_API_KEY || process.env.BREVO_API_KEY) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatApptDate(dateString) {
  if (!dateString) return 'Por definir';
  return new Date(dateString).toLocaleString('es-CO');
}

async function notifyOrderCreated(userEmail, orderId) {
  if (!userEmail) return;
  const transporter = getTransporter();
  const subject = `Nuevo pedido #${orderId} creado en El Vitral`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb;">¡Tu pedido ha sido creado con éxito!</h2>
      <p>Hola,</p>
      <p>Queríamos informarte que tu pedido con número <strong>#${orderId}</strong> ha sido creado correctamente en nuestro sistema y actualmente está en estado <strong>Pendiente</strong>.</p>
      <p>Nos pondremos en contacto contigo pronto o actualizaremos el estado de tu orden para proceder.</p>
      <p>Gracias por confiar en El Vitral.</p>
    </div>
  `;
  return sendEmail({ transporter, to: userEmail, subject, text: subject, html }).catch(err => console.error("Error al enviar correo (Crear pedido):", err));
}

async function notifyOrderStateChange(userEmail, orderId, newState) {
  if (!userEmail) return;
  const transporter = getTransporter();
  const subject = `Tu pedido #${orderId} ha cambiado a: ${newState}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb;">Actualización de Pedido</h2>
      <p>Hola,</p>
      <p>Tu pedido <strong>#${orderId}</strong> ahora se encuentra en estado: <strong style="text-transform: uppercase;">${newState}</strong>.</p>
      <p>Puedes entrar a la plataforma para ver más detalles.</p>
      <p>Saludos cordiales,<br/>El Vitral</p>
    </div>
  `;
  return sendEmail({ transporter, to: userEmail, subject, text: subject, html }).catch(err => console.error("Error al enviar correo (Actualizar pedido):", err));
}

async function notifyAppointment(userEmail, titulo, fecha_cita, isUpdate = false) {
  if (!userEmail) return;
  const transporter = getTransporter();
  const action = isUpdate ? 'actualizada' : 'agendada';
  const subject = `Cita ${action}: ${titulo}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb;">Notificación de Agenda</h2>
      <p>Hola,</p>
      <p>Tu cita "<strong>${titulo}</strong>" ha sido ${action}.</p>
      <p><strong>Fecha programada:</strong> ${formatApptDate(fecha_cita)}</p>
      <p>Estaremos esperando comunicarnos contigo en el tiempo pactado.</p>
      <p>Saludos,<br/>El Vitral</p>
    </div>
  `;
  return sendEmail({ transporter, to: userEmail, subject, text: subject, html }).catch(err => console.error("Error al enviar correo (Cita):", err));
}

async function notifyStockMovement(adminEmails, productoNombre, cantidad, movimiento, nuevoStock) {
  if (!adminEmails || adminEmails.length === 0) return;
  const transporter = getTransporter();
  const tipo = movimiento.toUpperCase(); // ENTRADA o SALIDA
  let color = tipo === 'ENTRADA' ? '#16a34a' : '#ef4444';
  const subject = `Aviso de Inventario: ${tipo} de ${productoNombre}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: ${color};">Movimiento de Inventario Registrado</h2>
      <p>Se ha registrado una <strong>${tipo}</strong> de inventario en el sistema.</p>
      <ul>
        <li><strong>Producto:</strong> ${productoNombre}</li>
        <li><strong>Cantidad ${tipo === 'ENTRADA' ? 'añadida' : 'retirada'}:</strong> ${cantidad}</li>
        <li><strong>Stock resultante:</strong> ${nuevoStock}</li>
      </ul>
      <p>Este es un correo automático enviado a los administradores.</p>
    </div>
  `;

  const promises = adminEmails.map(email =>
    sendEmail({ transporter, to: email, subject, text: subject, html })
      .catch(e => console.error("Error al enviar correo a admin", e))
  );
  await Promise.all(promises);
}

async function notifyPaymentReceived(adminEmails, pedidoId, amountPaid, isAnticipo) {
  if (!adminEmails || adminEmails.length === 0) return;
  const transporter = getTransporter();
  const tipo = isAnticipo ? 'Anticipo (50%)' : 'Total (100%)';
  const amountStr = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amountPaid);
  const subject = `Pago Recibido: Pedido #${pedidoId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2563eb;">Pago Confirmado</h2>
      <p>Se ha registrado un pago exitoso para el pedido <strong>#${pedidoId}</strong>.</p>
      <ul>
        <li><strong>Tipo de Pago:</strong> ${tipo}</li>
        <li><strong>Monto Pagado:</strong> ${amountStr}</li>
      </ul>
      <p>Revisa el sistema web para más información.</p>
    </div>
  `;

  const promises = adminEmails.map(email =>
    sendEmail({ transporter, to: email, subject, text: subject, html })
      .catch(e => console.error("Error al enviar correo a admin", e))
  );
  await Promise.all(promises);
}

async function notifyQuoteRejected(userEmail, quoteCode, customerName) {
  if (!userEmail) return;
  const transporter = getTransporter();
  const subject = `Actualización de tu cotización ${quoteCode}`;
  const text = `Hola ${customerName || ''}, tu cotización ${quoteCode} ha sido rechazada. Comunícate con EL VITRAL si necesitas más información.`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #dc2626;">Actualización de cotización</h2>
      <p>Hola${customerName ? ` <strong>${customerName}</strong>` : ''},</p>
      <p>Tu cotización <strong>${quoteCode}</strong> ha sido rechazada.</p>
      <p>Si necesitas más información o deseas ajustar tu solicitud, comunícate con EL VITRAL.</p>
      <p>Saludos cordiales,<br/>EL VITRAL</p>
    </div>
  `;
  return sendEmail({ transporter, to: userEmail, subject, text, html })
    .catch(error => console.error('Error al enviar correo de cotización rechazada:', error));
}

module.exports = {
  notifyOrderCreated,
  notifyOrderStateChange,
  notifyAppointment,
  notifyStockMovement,
  notifyPaymentReceived,
  notifyQuoteRejected
};
