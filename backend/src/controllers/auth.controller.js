const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../../lib/db.js');
const {
  hashPassword,
  comparePassword,
  sanitizeEmail,
  sanitizeString,
  getUserFromRequest,
  createSession,
  getSession,
  deleteSession,
} = require('../../lib/auth.js');
const { createPasswordResetToken, sendPasswordResetEmail } = require('../../lib/email.js');
const { checkRate, rateLimitError, getClientIp } = require('../../lib/rateLimit.js');
const {
  sendJSON,
  parseBody,
  parseCookies,
  createSessionCookies,
  clearCookies,
} = require('../utils/http.js');
const {
  ensureConsentColumns,
  ensureGoogleIdColumn,
  ensurePasswordResetColumns,
} = require('../services/tableInit.service.js');
const { validarDominioEmail } = require('../utils/validators.js');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

async function register(req, res) {
  const body = await parseBody(req);
  const nombre = sanitizeString(body.nombre);
  const email = sanitizeEmail(body.email);
  const password = sanitizeString(body.password);
  const telefono = sanitizeString(body.telefono || '');
  const direccion = sanitizeString(body.direccion || '');
  const aceptaPoliticaDatos = body.aceptaPoliticaDatos === true;
  const aceptaTerminos = body.aceptaTerminos === true;

  if (!nombre || !email || !password) {
    return sendJSON(res, 400, { error: 'Nombre, email y contraseña son obligatorios' });
  }
  if (!aceptaPoliticaDatos || !aceptaTerminos) {
    return sendJSON(res, 400, { error: 'Debes aceptar la política de tratamiento de datos y los términos y condiciones' });
  }
  if (process.env.NODE_ENV !== 'test') {
    await ensureConsentColumns();
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendJSON(res, 400, { error: 'El formato del correo no es válido' });
  }

  if (password.length < 6) {
    return sendJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
  if (Array.isArray(existing) && existing.length > 0) {
    return sendJSON(res, 409, { error: 'El correo ya está registrado' });
  }

  const errorDominio = await validarDominioEmail(email);
  if (errorDominio) {
    return sendJSON(res, 400, { error: errorDominio });
  }

  const hashedPassword = await hashPassword(password);
  const newUserId = crypto.randomUUID();
  await query(
    'INSERT INTO usuarios (id, nombre, email, password, telefono, direccion, rol, aprobado, politica_datos_aceptada, politica_datos_aceptada_at, terminos_aceptados, terminos_aceptados_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())',
    [newUserId, nombre, email, hashedPassword, telefono || null, direccion || null, 'usuario', true, true, true]
  );

  return sendJSON(res, 201, { message: 'Usuario registrado correctamente' });
}

async function login(req, res) {
  const body = await parseBody(req);
  const ip = getClientIp(req);
  const rateCheck = checkRate('login', ip, body?.email || '');
  if (!rateCheck.allowed) {
    return sendJSON(res, 429, rateLimitError('login'));
  }

  const email = sanitizeEmail(body.email);
  const password = sanitizeString(body.password);

  if (!email || !password) {
    return sendJSON(res, 400, { error: 'Email y contraseña son obligatorios' });
  }

  const rows = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 401, { error: 'Correo o contraseña incorrectos' });
  }

  const user = rows[0];
  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    return sendJSON(res, 401, { error: 'Correo o contraseña incorrectos' });
  }

  if (!user.activo) {
    return sendJSON(res, 403, { error: 'Tu cuenta está desactivada, llámanos al 3137928483 para reactivarla' });
  }

  if (!user.aprobado) {
    return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
  }

  const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
  res.setHeader('Set-Cookie', createSessionCookies(sid));

  return sendJSON(res, 200, {
    message: 'Inicio de sesion exitoso',
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  });
}

async function googleLogin(req, res) {
  const body = await parseBody(req);
  const ip = getClientIp(req);
  const rateCheck = checkRate('google', ip, '');
  if (!rateCheck.allowed) {
    return sendJSON(res, 429, rateLimitError('google'));
  }

  const credential = body.credential;
  if (!credential) {
    return sendJSON(res, 400, { error: 'Token de Google requerido' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = sanitizeEmail(payload.email);
    const name = sanitizeString(payload.name);
    const googleId = sanitizeString(payload.sub);

    await ensureGoogleIdColumn();

    let userRows = await query('SELECT * FROM usuarios WHERE google_id = ?', [googleId]);
    let user;

    if (!Array.isArray(userRows) || userRows.length === 0) {
      userRows = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
      if (Array.isArray(userRows) && userRows.length > 0) {
        await query('UPDATE usuarios SET google_id = ? WHERE id = ?', [googleId, userRows[0].id]);
      } else {
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await hashPassword(randomPassword);
        const newUserId = crypto.randomUUID();
        await query(
          'INSERT INTO usuarios (id, nombre, email, password, telefono, direccion, rol, aprobado, google_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [newUserId, name, email, hashedPassword, null, null, 'usuario', true, googleId]
        );
      }
      userRows = await query('SELECT * FROM usuarios WHERE google_id = ?', [googleId]);
    }

    user = userRows[0];

    if (!user.activo) {
      return sendJSON(res, 403, { error: 'Tu cuenta está desactivada, llámanos al 3137928483 para reactivarla' });
    }
    if (!user.aprobado) {
      return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
    }

    const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
    res.setHeader('Set-Cookie', createSessionCookies(sid));

    return sendJSON(res, 200, {
      message: 'Inicio de sesion exitoso con Google',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error verifying Google Token:', error);
    return sendJSON(res, 401, { error: 'Token de Google inválido' });
  }
}

async function forgotPassword(req, res) {
  const body = await parseBody(req);
  const ip = getClientIp(req);
  const rateCheck = checkRate('forgot', ip, '');
  if (!rateCheck.allowed) {
    return sendJSON(res, 429, rateLimitError('forgot'));
  }

  const email = sanitizeEmail(body.email);
  if (!email) {
    return sendJSON(res, 400, { error: 'El correo es obligatorio' });
  }

  const errorDominio = await validarDominioEmail(email);
  if (errorDominio) {
    return sendJSON(res, 400, { error: errorDominio });
  }

  await ensurePasswordResetColumns();

  const rows = await query('SELECT id, nombre, email FROM usuarios WHERE email = ?', [email]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 404, {
      error: 'No encontramos una cuenta registrada con este correo',
    });
  }

  const user = rows[0];
  const token = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await query(
    'UPDATE usuarios SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
    [token, expiresAt, user.id]
  );

  let detectedFrontendUrl = req.headers['x-frontend-url']
    || req.headers['origin']
    || (req.headers['referer'] ? (() => { try { return new URL(req.headers['referer']).origin; } catch { return null; } })() : null);

  const targetFrontendUrl = (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'))
    ? process.env.FRONTEND_URL
    : (detectedFrontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000');

  try {
    await sendPasswordResetEmail({
      to: user.email,
      token,
      frontendUrl: targetFrontendUrl,
    });
  } catch (emailError) {
    console.error('Error sending password reset email:', emailError);
    return sendJSON(res, 500, {
      error: `No se pudo enviar el correo: ${emailError.message || 'Error desconocido'}`,
    });
  }

  return sendJSON(res, 200, {
    message: 'Hemos enviado instrucciones para recuperar tu contraseña a tu correo.',
  });
}

async function resetPassword(req, res) {
  const body = await parseBody(req);
  const token = sanitizeString(body.token || '');
  const password = sanitizeString(body.password || '');

  if (!token || !password) {
    return sendJSON(res, 400, { error: 'El token y la nueva contraseña son obligatorios' });
  }

  if (password.length < 6) {
    return sendJSON(res, 400, { error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  await ensurePasswordResetColumns();

  const rows = await query(
    'SELECT id FROM usuarios WHERE reset_token = ? AND reset_expires_at > NOW() LIMIT 1',
    [token]
  );

  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 400, { error: 'El enlace de recuperación es inválido o ha expirado' });
  }

  const hashedPassword = await hashPassword(password);
  await query(
    'UPDATE usuarios SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
    [hashedPassword, rows[0].id]
  );

  return sendJSON(res, 200, { message: 'Contraseña actualizada correctamente' });
}

function logout(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.sid) {
    deleteSession(cookies.sid);
  }
  res.setHeader('Set-Cookie', clearCookies());
  return sendJSON(res, 200, { message: 'Sesión cerrada' });
}

async function refresh(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = getSession(cookies.sid);
  if (!session) {
    return sendJSON(res, 401, { error: 'No session found' });
  }

  const userRows = await query('SELECT id, rol, nombre, email, activo, aprobado FROM usuarios WHERE id = ?', [session.userId]);
  if (!Array.isArray(userRows) || userRows.length === 0) {
    deleteSession(cookies.sid);
    return sendJSON(res, 401, { error: 'Usuario no encontrado' });
  }

  const user = userRows[0];
  if (!user.activo) return sendJSON(res, 403, { error: 'Tu cuenta está desactivada, llámanos al 3137928483 para reactivarla' });
  if (!user.aprobado) return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });

  deleteSession(cookies.sid);
  const { sid } = createSession({ id: user.id, rol: user.rol, nombre: user.nombre, email: user.email });
  res.setHeader('Set-Cookie', createSessionCookies(sid));

  return sendJSON(res, 200, {
    message: 'Sesión renovada correctamente',
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  });
}

function getSessionInfo(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No sesión activa' });
  }
  return sendJSON(res, 200, { authenticated: true, rol: userData.rol });
}

async function getMe(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const rows = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, activo, ultimo_acceso FROM usuarios WHERE id = ?', [userData.id]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return sendJSON(res, 401, { error: 'Usuario no encontrado' });
  }

  const user = rows[0];
  if (!user.activo) {
    return sendJSON(res, 403, { error: 'Tu cuenta está desactivada' });
  }
  if (!user.aprobado) {
    return sendJSON(res, 403, { error: 'Cuenta en espera de aprobación' });
  }

  const { activo: _activo, ...safeUser } = user;
  return sendJSON(res, 200, safeUser);
}

async function updateMe(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  const nombre = sanitizeString(body.nombre || '');
  const email = sanitizeEmail(body.email || '');
  const telefono = sanitizeString(body.telefono || '');
  const direccion = sanitizeString(body.direccion || '');

  if (!nombre || !email) {
    return sendJSON(res, 400, { error: 'Nombre y correo son obligatorios' });
  }

  const errorDominio = await validarDominioEmail(email);
  if (errorDominio) {
    return sendJSON(res, 400, { error: errorDominio });
  }

  const existing = await query('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, userData.id]);
  if (Array.isArray(existing) && existing.length > 0) {
    return sendJSON(res, 409, { error: 'El correo ya está en uso' });
  }

  await query(
    'UPDATE usuarios SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
    [nombre, email, telefono || null, direccion || null, userData.id]
  );

  const updatedRows = await query('SELECT id, nombre, email, telefono, direccion, rol, aprobado, ultimo_acceso FROM usuarios WHERE id = ?', [userData.id]);
  return sendJSON(res, 200, updatedRows[0]);
}

async function recordLastAccess(req, res) {
  const userData = getUserFromRequest(req);
  if (!userData) {
    return sendJSON(res, 401, { error: 'No autorizado' });
  }

  const body = await parseBody(req);
  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();
  if (Number.isNaN(timestamp.getTime())) {
    return sendJSON(res, 400, { error: 'Timestamp inválido' });
  }

  await query('UPDATE usuarios SET ultimo_acceso = ? WHERE id = ?', [timestamp, userData.id]);
  return sendJSON(res, 200, { message: 'Último acceso registrado' });
}

module.exports = {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  logout,
  refresh,
  getSessionInfo,
  getMe,
  updateMe,
  recordLastAccess,
};
