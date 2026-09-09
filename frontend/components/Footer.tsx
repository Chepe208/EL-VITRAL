'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface User {
  id: number;
  nombre: string;
  rol: string;
}

const linkClass = 'text-gray-400 hover:text-primary text-sm transition-colors';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <footer style={{ backgroundColor: '#0f1419' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white font-bold text-lg mb-4">El Vitral</h3>
            <p className="text-gray-400 text-sm">
              Especialistas en soluciones de vidrio, espejos y herrajes para tu hogar y negocio.
            </p>
            <p className="text-gray-400 text-sm mt-4">
              <strong>Teléfono:</strong> 3137928483
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Productos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo?tipo=vidrio" className={linkClass}>
                  Vidrio
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=espejo" className={linkClass}>
                  Espejos
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=aluminio" className={linkClass}>
                  Aluminio
                </Link>
              </li>
              <li>
                <Link href="/catalogo?tipo=herraje" className={linkClass}>
                  Herrajes
                </Link>
              </li>
              <li>
                <Link href="/catalogo" className={linkClass}>
                  Ver catálogo completo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className={linkClass}>
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/cotizar" className={linkClass}>
                  Cotizar
                </Link>
              </li>
              <li>
                <Link href="/proyectos" className={linkClass}>
                  Proyectos
                </Link>
              </li>
              <li>
                <Link href="/sobre-nosotros" className={linkClass}>
                  Sobre nosotros
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Cuenta</h4>
            <ul className="space-y-2">
              {user ? (
                <>
                  <li>
                    <Link href="/perfil" className={linkClass}>
                      Mi perfil
                    </Link>
                  </li>
                  <li>
                    <Link href="/cotizaciones" className={linkClass}>
                      Mis cotizaciones
                    </Link>
                  </li>
                  <li>
                    <Link href="/mis-pedidos" className={linkClass}>
                      Mis pedidos
                    </Link>
                  </li>
                  {user.rol === 'admin' && (
                    <li>
                      <Link href="/admin" className={linkClass}>
                        Panel admin
                      </Link>
                    </li>
                  )}
                  <li>
                    <button type="button" onClick={logout} className={`${linkClass} text-left`}>
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/login" className={linkClass}>
                      Iniciar sesión
                    </Link>
                  </li>
                  <li>
                    <Link href="/registro" className={linkClass}>
                      Registrarse
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8">
          <div className="flex items-center justify-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} El Vitral. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
