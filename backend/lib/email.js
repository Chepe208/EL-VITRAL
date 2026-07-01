async function sendEmail({ transporter, to, subject, text, html }) {
  if (!transporter || typeof transporter.sendMail !== 'function') {
    throw new Error('Transporter de correo invalido');
  }

  if (!to || !subject || (!text && !html)) {
    throw new Error('Faltan datos para enviar el correo');
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || 'EL VITRAL <no-reply@elvitral.com>',
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendEmail,
};