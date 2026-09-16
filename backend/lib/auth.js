const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function resolveSecret(name) {
  const value = process.env[name];
  if (value && value.length >= 16) {
    return value;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} no está configurado. Debe definirse en producción.`);
  }
  console.warn(`AVISO: ${name} no configurado. Usando secreto aleatorio efímero en desarrollo.`);
  return crypto.randomBytes(32).toString('hex');
}

const JWT_SECRET = resolveSecret('JWT_SECRET');

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function sanitizeString(value) {
  const text = String(value ?? '').trim();
  return text.replace(/[\x00-\x1F\x7F]/g, '');
}

function sanitizeEmail(value) {
  const email = sanitizeString(value).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Email inválido');
  }
  return email;
}

const JWT_REFRESH_SECRET = resolveSecret('JWT_REFRESH_SECRET');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días (sliding expiration)
const sessions = new Map();

function randomSid() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Crea una sesión opaca para un usuario.
 * @param {{ id: string, rol: string, nombre?: string, email?: string }} user
 * @returns {{ sid: string, session: object }}
 */
function createSession(user) {
  const sid = randomSid();
  const accessToken = generateAccessToken({
    id: user.id,
    rol: user.rol,
    nombre: user.nombre,
    email: user.email,
  });
  const session = {
    sid,
    userId: user.id,
    rol: user.rol,
    nombre: user.nombre,
    email: user.email,
    accessToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessions.set(sid, session);
  return { sid, session };
}

function touchSession(session) {
  session.expiresAt = Date.now() + SESSION_TTL_MS;
}

function getSession(sid) {
  if (!sid) return null;
  const session = sessions.get(sid);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(sid);
    return null;
  }
  // Sliding expiration: cada uso válido renueva la sesión.
  touchSession(session);
  return session;
}

function deleteSession(sid) {
  if (!sid) return;
  sessions.delete(sid);
}

function deleteSessionsForUser(userId) {
  for (const [sid, session] of sessions.entries()) {
    if (session.userId === userId) sessions.delete(sid);
  }
}

function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.split('=');
    const trimmedName = name?.trim();
    if (trimmedName) {
      cookies[trimmedName] = rest.join('=').trim();
    }
  });

  return cookies;
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

function getUserFromRequest(req) {
  // 1. Cookie de sesión opaca (producción / navegador)
  let user = null;
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const session = getSession(cookies.sid);
    if (session) {
      user = verifyAccessToken(session.accessToken);
      if (!user) {
        session.accessToken = generateAccessToken({
          id: session.userId,
          rol: session.rol,
          nombre: session.nombre,
          email: session.email,
        });
        user = verifyAccessToken(session.accessToken);
      }
    }
  } catch (e) {
    user = null;
  }
  if (user) return user;

  if (process.env.ALLOW_BEARER_AUTH === 'true') {
    const tokenFromBearer = extractBearerToken(req);
    if (tokenFromBearer) {
      const decoded = verifyAccessToken(tokenFromBearer);
      if (decoded) return decoded;
    }
  }

  return null;
}

function isAdmin(user) {
  return Boolean(user && user.rol === 'admin');
}

/**
 * Verifica que la request venga de un usuario autenticado con rol admin.
 * El rol se asigna externamente (directamente en la base de datos / panel interno);
 * esta API nunca permite auto-asignarse ni modificar el rol de un usuario.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {{ ok: true, user: object } | { ok: false, status: number, error: string }}
 */
function requireAuth(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }
  return { ok: true, user };
}

function requireAdmin(req) {
  const user = getUserFromRequest(req);
  if (!user) {
    return { ok: false, status: 401, error: 'No autorizado' };
  }
  if (!isAdmin(user)) {
    return { ok: false, status: 403, error: 'No tiene permisos de administrador' };
  }
  return { ok: true, user };
}

module.exports = {
  hashPassword,
  comparePassword,
  sanitizeString,
  sanitizeEmail,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getUserFromRequest,
  isAdmin,
  requireAuth,
  requireAdmin,
  parseCookies,
  extractBearerToken,
  createSession,
  getSession,
  deleteSession,
  deleteSessionsForUser,
};