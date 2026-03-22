import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  const publicPaths = ['/', '/catalogo', '/cotizar', '/login', '/registro', '/olvide-password', '/reset-password'];
  if (publicPaths.includes(path) || path.startsWith('/api')) {
    return NextResponse.next();
  }

  if (!token || !verifyToken(token)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};