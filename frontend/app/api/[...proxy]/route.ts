import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function handler(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;
  
  console.log('🔍 [Proxy] Incoming request - pathname:', pathname, 'method:', req.method);
  
  // Extract /api/{path*} and rebuild URL to backend
  const pathMatch = pathname.match(/^\/api\/(.*)$/);
  if (!pathMatch) {
    console.log('❌ [Proxy] Path does not match /api pattern');
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const apiPath = pathMatch[1];
  const backendUrl = new URL(`${BACKEND_URL}/api/${apiPath}`);
  
  console.log('📍 [Proxy] Backend URL:', backendUrl.toString());
  
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
    } else if (contentType?.includes('application/x-www-form-urlencoded') || 
               contentType?.includes('multipart/form-data')) {
      body = await req.arrayBuffer();
    } else {
      body = await req.text();
    }
  }

  // Forward request headers
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!['connection', 'host', 'content-length'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  // Ensure content-type is set
  if (contentType) {
    headers.set('content-type', contentType);
  }

  try {
    const response = await fetch(backendUrl.toString(), {
      method: req.method,
      headers,
      body,
      credentials: 'include',
    });

    // Forward response
    const responseBody = await response.text();
    const responseHeaders = new Headers(response.headers);
    
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
      { error: 'Backend error', details: String(error) },
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
