require('dotenv').config();

const crypto = require('crypto');
const nodemailer = require('nodemailer');

function createPasswordResetToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildResetPasswordLink(token, frontendUrl = 'http://localhost:3000') {
  return `${frontendUrl.replace(/\/$/, '')}/reset-password/${token}`;
}

async function sendEmail({ transporter, to, subject, text, html }) {
  // 1. Soporte para Resend HTTP API (puerto 443, no se bloquea en Render)
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'EL VITRAL <onboarding@resend.dev>',
        to: Array.isArray(to) ? to : [to],
        subject,
        text,
        html,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Error Resend API:', data);
      throw new Error(`Error Resend: ${data.message || JSON.stringify(data)}`);
    }
    return data;
  }

  // 2. Soporte para Brevo HTTP API (puerto 443, 300 correos/día a cualquier correo)
  if (process.env.BREVO_API_KEY) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'EL VITRAL',
          email: process.env.SMTP_USER || 'elvitralsena@gmail.com',
        },
        to: (Array.isArray(to) ? to : [to]).map(e => ({ email: e })),
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('Error Brevo API:', data);
      throw new Error(`Error Brevo: ${data.message || JSON.stringify(data)}`);
    }
    return data;
  }

  // 3. Fallback: SMTP tradicional con Nodemailer
  if (!transporter || !to || !subject || !text) {
    throw new Error('Faltan datos para enviar el correo o credenciales de email');
  }

  return transporter.sendMail({
    from: process.env.SMTP_USER ? `EL VITRAL <${process.env.SMTP_USER}>` : 'EL VITRAL <no-reply@elvitral.com>',
    to,
    subject,
    text,
    html,
  });
}

async function sendPasswordResetEmail({ to, token, frontendUrl }) {
  let transporter = null;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!process.env.RESEND_API_KEY && !process.env.BREVO_API_KEY) {
    if (!smtpUser || !smtpPass) {
      throw new Error('Faltan credenciales SMTP (o RESEND_API_KEY / BREVO_API_KEY).');
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  const resetLink = buildResetPasswordLink(token, frontendUrl);
  const subject = 'Recupera tu contraseña en EL VITRAL';
  const text = `Hola,\n\nRecibimos una solicitud para recuperar tu contraseña.\nHaz clic en el siguiente enlace para restablecerla:\n${resetLink}\n\nSi no solicitaste este cambio, puedes ignorar este correo.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
      <h2 style="color: #0f172a;">Recupera tu contraseña</h2>
      <p>Hola,</p>
      <p>Recibimos una solicitud para recuperar tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
      <p style="margin: 24px 0;"><a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 18px; border-radius: 8px; text-decoration: none;">Restablecer contraseña</a></p>
      <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #4b5563;">${resetLink}</p>
      <p style="margin-top: 20px; color: #6b7280;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
    </div>
  `;

  return sendEmail({ transporter, to, subject, text, html });
}

module.exports = {
  createPasswordResetToken,
  buildResetPasswordLink,
  sendEmail,
  sendPasswordResetEmail,
};
