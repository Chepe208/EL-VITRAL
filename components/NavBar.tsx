'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    closeMenu();
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" onClick={closeMenu}>
              <img src="/logo.jpeg" alt="Logo El Vitral" className="h-12 w-auto" />
            </Link>
          </div>

          {}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`font-medium ${
                pathname === '/' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Inicio
            </Link>
            <Link
              href="/catalogo"
              className={`font-medium ${
                pathname === '/catalogo' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Catálogo
            </Link>
            <Link
              href="/cotizar"
              className={`font-medium ${
                pathname === '/cotizar' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
              }`}
              onClick={closeMenu}
            >
              Cotizar
            </Link>
            {user && (
              <>
                <Link
                  href="/mis-pedidos"
                  className={`font-medium ${
                    pathname === '/mis-pedidos' ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                  }`}
                  onClick={closeMenu}
                >
                  Mis Pedidos
                </Link>
                {user.rol === 'admin' && (
                  <Link
                    href="/admin"
                    className={`font-medium ${
                      pathname.startsWith('/admin') ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                    }`}
                    onClick={closeMenu}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {}
          <div className="hidden md:flex items-center relative">
            <div
              ref={buttonRef}
              onClick={toggleMenu}
              className="cursor-pointer p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-3xl">
                menu
              </span>
            </div>

            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50"
              >
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMenu}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/registro"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMenu}
                    >
                      Registrarse
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      Hola, {user.nombre}
                    </div>
                    <Link
                      href="/mis-pedidos"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={closeMenu}
                    >
                      Mis Pedidos
                    </Link>
                    {user.rol === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={closeMenu}
                      >
                        Panel Admin
                      </Link>
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

          {}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 focus:outline-none"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            {menuOpen && (
              <div className="absolute right-4 top-16 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50">
                {}
                {!user ? (
                  <>
                    <Link href="/" className="block px-4 py-2 text-sm" onClick={closeMenu}>Inicio</Link>
                    <Link href="/catalogo" className="block px-4 py-2 text-sm" onClick={closeMenu}>Catálogo</Link>
                    <Link href="/cotizar" className="block px-4 py-2 text-sm" onClick={closeMenu}>Cotizar</Link>
                    <Link href="/login" className="block px-4 py-2 text-sm" onClick={closeMenu}>Iniciar Sesión</Link>
                    <Link href="/registro" className="block px-4 py-2 text-sm" onClick={closeMenu}>Registrarse</Link>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">Hola, {user.nombre}</div>
                    <Link href="/mis-pedidos" className="block px-4 py-2 text-sm" onClick={closeMenu}>Mis Pedidos</Link>
                    {user.rol === 'admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm" onClick={closeMenu}>Admin</Link>
                    )}
                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600">
                      Cerrar sesión
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}