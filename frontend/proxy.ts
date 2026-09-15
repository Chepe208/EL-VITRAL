import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000'

// Rutas que NO requieren autenticación.
const PUBLIC_PATHS = [
  '/',
  '/catalogo',
  '/cotizar',
  '/proyectos',
  '/sobre-nosotros',
  '/login',
  '/registro',
  '/olvide-password',
  '/reset-password',
  '/politica-privacidad',
  '/politica-cookies',
  '/terminos-condiciones',
]

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/reset-password/') ||
    pathname.startsWith('/proyectos/')
  )
}

/**
 * Valida la sesión contra el backend. El navegador solo tiene una cookie
 * "sid" opaca (sin token); el backend confirma si la sesión es válida.
 * Devuelve { authenticated, rol }.
 */
async function checkSession(request: NextRequest) {
  if (!request.cookies.get('sid')) {
    return { authenticated: false, rol: null }
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/session`, {
      method: 'GET',
      headers: { cookie: request.headers.get('cookie') || '' },
      cache: 'no-store',
    })
    if (res.status === 401) return { authenticated: false, rol: null }
    const data = await res.json()
    return { authenticated: true, rol: data.rol ?? null }
  } catch {
    return { authenticated: false, rol: null }
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Assets y API internos pasan siempre. Los archivos estáticos del directorio
  // public/ (imágenes, css, fuentes, etc.) también deben servirse sin importar
  // el estado de autenticación; de lo contrario se redirigirían a /login.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1)
  const isStaticFile = lastSegment.includes('.') && !pathname.endsWith('/')
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images') ||
    isStaticFile
  ) {
    return NextResponse.next()
  }

  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // Rutas privadas: validar sesión contra el backend.
  const session = await checkSession(request)
  if (!session.authenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutas de administración: exigir rol admin.
  if (pathname.startsWith('/admin') && session.rol !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
