const { createPDFDocument } = require('../../lib/pdfDesign.js');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function setHeaders(res, status = 200, contentType = 'application/json') {
  const headers = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  res.writeHead(status, headers);
}

function sendJSON(res, status, payload) {
  setHeaders(res, status, 'application/json');
  res.end(JSON.stringify(payload));
}

function sendPDF(res, filename, buildDoc) {
  res.writeHead(200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="${filename}"`,
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  });

  const doc = createPDFDocument();
  doc.pipe(res);
  buildDoc(doc);
  doc.end();
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name) return cookies;
    cookies[name.trim()] = rest.join('=').trim();
    return cookies;
  }, {});
}

function extractRouteParts(pathname) {
  return pathname.split('/').filter(Boolean);
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        return resolve({});
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        console.error('Invalid JSON body received:', {
          method: req.method,
          url: req.url ? req.url.split('?')[0] : '',
          contentType: (req.headers && req.headers['content-type']) || null,
          contentLength: body ? Buffer.byteLength(body, 'utf8') : 0,
          error: error.name || 'SyntaxError',
        });
        const err = new Error('Invalid JSON body');
        err.status = 400;
        reject(err);
      }
    });

    req.on('error', reject);
  });
}

function expiredCookie(name) {
  const parts = [`${name}=; Path=/`, 'Expires=Thu, 01 Jan 1970 00:00:00 GMT', 'SameSite=Lax'];
  if (isProduction()) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function createCookie(sid) {
  const parts = [`sid=${sid}`, 'Path=/', 'SameSite=Lax'];

  if (isProduction()) {
    parts.push('Secure');
  }

  parts.push('HttpOnly');

  return parts.join('; ');
}

function createSessionCookies(sid) {
  return [
    expiredCookie('accessToken'),
    expiredCookie('token'),
    createCookie(sid),
  ];
}

function clearCookies() {
  return [
    expiredCookie('accessToken'),
    expiredCookie('token'),
    expiredCookie('sid'),
  ];
}

module.exports = {
  setHeaders,
  sendJSON,
  sendPDF,
  parseCookies,
  extractRouteParts,
  parseBody,
  expiredCookie,
  createCookie,
  createSessionCookies,
  clearCookies,
};
