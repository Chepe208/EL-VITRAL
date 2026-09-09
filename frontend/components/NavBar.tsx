'use client';
import { memo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

function Navbar() {
  const { user, clearUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [message, setMessage] = useState('');

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const desktopButtonRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const router = useRouter();

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(target)
      ) {
        setMobileMenuOpen(false);
      }
      if (
        desktopMenuOpen &&
        desktopMenuRef.current &&
        !desktopMenuRef.current.contains(target) &&
        desktopButtonRef.current &&
        !desktopButtonRef.current.contains(target)
      ) {
        setDesktopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen, desktopMenuOpen]);

  // Envío de último acceso (igual)
  const sendLastAccess = () => {
    const url = '/api/auth/ultimo-acceso';
    const data = JSON.stringify({ timestamp: new Date().toISOString() });
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: data,
      }).catch(() => { });
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => sendLastAccess();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendLastAccess();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    clearUser();
    setMessage('Salida exitosa');
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setMessage('');
      window.location.href = '/';
    }, 1400);
  }, [clearUser]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeDesktopMenu = () => setDesktopMenuOpen(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" onClick={closeMobileMenu}>
              <Image src="/logo.jpeg" alt="Logo El Vitral" width={172} height={48} className="h-12 w-auto" />
            </Link>
          </div>

          {/* Menú escritorio (enlaces principales SIN Admin) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium ${pathname === '/' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              onClick={closeDesktopMenu}
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className={`font-medium ${pathname === '/catalogo' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              onClick={closeDesktopMenu}
            >
              Catálogo
            </Link>
            <Link
              href="/cotizar"
              className={`font-medium ${pathname === '/cotizar' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              onClick={closeDesktopMenu}
            >
              Cotizar
            </Link>
            <Link
              href="/sobre-nosotros"
              className={`font-medium ${pathname === '/sobre-nosotros' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                }`}
              onClick={closeDesktopMenu}
            >
              Sobre Nosotros
            </Link>
            {/* Admin ya no aparece aquí, solo en el desplegable */}
          </div>

          {/* Zona derecha: usuario / menú desplegable (escritorio) */}
          <div className="hidden md:flex items-center relative">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Hola, {user.nombre}
                </span>
                <div
                  ref={desktopButtonRef}
                  onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                  className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-3xl">
                    account_circle
                  </span>
                </div>
              </div>
            ) : (
              <div
                ref={desktopButtonRef}
                onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-3xl">
                  menu
                </span>
              </div>
            )}

            {/* Desplegable escritorio */}
            {desktopMenuOpen && (
              <div
                ref={desktopMenuRef}
                className="absolute right-0 top-12 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50"
              >
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeDesktopMenu}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/registro"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeDesktopMenu}
                    >
                      Registrarse
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/perfil"
                      className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeDesktopMenu}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeDesktopMenu}
                    >
                      Mis Pedidos
                    </Link>
                    <Link
                      href="/cotizaciones"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeDesktopMenu}
                    >
                      Mis Cotizaciones
                    </Link>
                    {/* Admin solo aquí para usuarios admin */}
                    {user.rol === 'admin' && (
                      <button
                        onClick={() => {
                          closeDesktopMenu();
                          router.push('/admin');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Panel Admin
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ===== MENÚ MÓVIL ===== */}
          <div className="md:hidden flex items-center">
            <button
              ref={mobileButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-3 rounded-md text-gray-600 dark:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menú principal"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {mobileMenuOpen && (
              <div
                ref={mobileMenuRef}
                className="absolute right-4 left-4 top-16 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-y-auto"
              >
                {/* Enlaces principales (sin Admin) */}
                <Link
                  href="/"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={closeMobileMenu}
                >
                  Inicio
                </Link>
                <Link
                  href="/catalogo"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={closeMobileMenu}
                >
                  Catálogo
                </Link>
                <Link
                  href="/cotizar"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={closeMobileMenu}
                >
                  Cotizar
                </Link>
                <Link
                  href="/sobre-nosotros"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={closeMobileMenu}
                >
                  Sobre Nosotros
                </Link>

                {!user ? (
                  <>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <Link
                      href="/login"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMobileMenu}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/registro"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMobileMenu}
                    >
                      Registrarse
                    </Link>
                  </>
                ) : (
                  <>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <Link
                      href="/perfil"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMobileMenu}
                    >
                      Mi Perfil ({user.nombre})
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMobileMenu}
                    >
                      Mis Pedidos
                    </Link>
                    <Link
                      href="/cotizaciones"
                      className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMobileMenu}
                    >
                      Mis Cotizaciones
                    </Link>
                    {/* Admin solo aquí para usuarios admin */}
                    {user.rol === 'admin' && (
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          router.push('/admin');
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Panel Admin
                      </button>
                    )}
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className="mt-2 bg-green-100 text-green-800 px-4 py-2 rounded shadow text-center">
            {message}
          </div>
        )}
      </div>
    </nav>
  );
}

export default memo(Navbar);