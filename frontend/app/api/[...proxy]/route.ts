import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const EXCLUDED_HEADERS = ['connection', 'host', 'content-length'];

// La cookie del navegador contiene únicamente un identificador de sesión
// opaco ("sid") sin tokens. Por eso aquí no hay cifrado: no hay nada secreto
// en el navegador. El backend reenvía la cookie tal cual (HttpOnly) y es la
// fuente de verdad de la autenticación.

function getSetCookies(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.();
  if (cookies?.length) return cookies;

  const cookie = response.headers.get('set-cookie');
  if (cookie) return [cookie];
  return [];
}

export async function handler(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // Extract /api/{path*} and rebuild URL to backend
  const pathMatch = pathname.match(/^\/api\/(.*)$/);
  if (!pathMatch) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const apiPath = pathMatch[1];
  const backendUrl = new URL(`${BACKEND_URL}/api/${apiPath}`);

  // Preserve query parameters
  searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  // Prepare request body
  let body: BodyInit | undefined;
  const contentType = req.headers.get('content-type');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (contentType?.includes('application/json')) {
      body = await req.text();
    } else if (
      contentType?.includes('application/x-www-form-urlencoded') ||
      contentType?.includes('multipart/form-data')
    ) {
      body = await req.arrayBuffer();
    } else {
      body = await req.text();
    }
  }

  // Forward request headers (cookie incluída tal cual)
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!EXCLUDED_HEADERS.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  if (contentType) {
    headers.set('content-type', contentType);
  }
  headers.set('x-frontend-url', req.nextUrl.origin);

  try {
    let response = await fetch(backendUrl.toString(), {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    });

    // Si la sesión expiró (401), intenta renovarla con el endpoint refresh y
    // repite la petición original de forma transparente.
    let refreshedCookies: string[] = [];
    if (response.status === 401 && !['auth/login', 'auth/google', 'auth/refresh', 'auth/session'].includes(apiPath)) {
      const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { cookie: req.headers.get('cookie') || '' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        refreshedCookies = getSetCookies(refreshResponse);
        const sid = refreshedCookies
          .map((cookie) => cookie.split(';')[0])
          .find((cookie) => cookie.startsWith('sid='));
        if (sid) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('cookie', sid);
          response = await fetch(backendUrl.toString(), {
            method: req.method,
            headers: retryHeaders,
            body,
            credentials: 'include',
          });
        }
      }
    }

    // Forward response without decoding it as text so PDFs and other binaries stay intact.
    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers(response.headers);

    // Remove headers that were invalidated by fetch's automatic body decompression
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    // Reenviar las cookies (sid) que devuelva el backend tal cual, incluidas
    // las del refresh, de modo que el navegador conserve la sesión.
    refreshedCookies.forEach((cookie) => {
      responseHeaders.append('set-cookie', cookie);
    });

    // Allow CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor. Inténtalo de nuevo.' },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
export const PUT = handler;
export const OPTIONS = handler;
