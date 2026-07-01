const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

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

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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
  // 1. Intentar con Bearer Token (HEADER)
  const tokenFromBearer = extractBearerToken(req);
  if (tokenFromBearer) {
    const decoded = verifyToken(tokenFromBearer);
    if (decoded) return decoded;
  }
  
  const cookies = parseCookies(req.headers.cookie || '');
  const tokenFromCookie = cookies.token;
  if (tokenFromCookie) {
    const decoded = verifyToken(tokenFromCookie);
    if (decoded) return decoded;
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
  generateToken,
  verifyToken,
  getUserFromRequest,
  isAdmin,
  requireAdmin,
  parseCookies,
  extractBearerToken, 
};