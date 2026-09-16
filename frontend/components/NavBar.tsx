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
  const desktopButtonRef = useRef<HTMLButtonElement>(null);

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

  // Envío de último acceso
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
      }).catch(() => {});
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
    setMessage('Sesión cerrada correctamente');
    setDesktopMenuOpen(false);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setMessage('');
      window.location.href = '/';
    }, 1200);
  }, [clearUser]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const closeDesktopMenu = () => setDesktopMenuOpen(false);

  const navLinks = [
    { href: '/', label: 'Inicio', icon: 'home' },
    { href: '/catalogo', label: 'Catálogo', icon: 'inventory_2' },
    { href: '/proyectos', label: 'Proyectos', icon: 'photo_library' },
    { href: '/sobre-nosotros', label: 'Sobre Nosotros', icon: 'info' },
  ];

  const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="sticky top-0 z-50 bg-[#0d131f]/90 backdrop-blur-xl border-b border-gray-800/80 shadow-xl shadow-black/25 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo y Marca */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-3 group">
              <div className="relative overflow-hidden rounded-xl border border-gray-800 group-hover:border-cyan-500/40 transition-colors p-1 bg-[#131b2e]">
                <Image
                  src="/logo.jpeg"
                  alt="Logo El Vitral"
                  width={150}
                  height={40}
                  className="h-10 sm:h-11 w-auto object-contain rounded-lg group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Menú Escritorio (Enlaces Principales) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2 bg-[#121a2b]/80 border border-gray-800/80 px-3 py-1.5 rounded-full shadow-inner">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeDesktopMenu}
                  className={`text-xs lg:text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md shadow-cyan-950/60'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/70'
                  }`}
                >
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Zona Derecha: Botón Cotizar + Usuario (Escritorio) */}
          <div className="hidden md:flex items-center gap-3.5">
            {/* Botón Destacado: Cotizar */}
            <Link
              href="/cotizar"
              className={`inline-flex items-center gap-1.5 text-xs lg:text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md ${
                pathname === '/cotizar'
                  ? 'bg-cyan-500 text-black shadow-cyan-500/30'
                  : 'bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 hover:text-white border border-cyan-500/40 hover:border-cyan-400/70'
              }`}
            >
              <span className="material-symbols-outlined text-base">calculate</span>
              <span>Cotizar</span>
            </Link>

            {/* Menú de Usuario / Login */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  ref={desktopButtonRef}
                  onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                  aria-expanded={desktopMenuOpen}
                  aria-label="Menú de usuario"
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#131b2e] hover:bg-[#18233b] border border-gray-800 hover:border-cyan-500/40 text-gray-200 transition-all cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {userInitial}
                  </div>
                  <span className="text-xs font-semibold max-w-[100px] truncate">{user.nombre || 'Mi Cuenta'}</span>
                  <span className="material-symbols-outlined text-base text-gray-400">expand_more</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="text-xs lg:text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800/60 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/registro"
                    className="text-xs lg:text-sm font-bold bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-2 rounded-xl border border-gray-700 transition-all"
                  >
                    Registrarse
                  </Link>
                </div>
              )}

              {/* Desplegable de Usuario (Escritorio) */}
              {desktopMenuOpen && user && (
                <div
                  ref={desktopMenuRef}
                  className="absolute right-0 top-14 w-60 bg-[#131b2e] border border-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Cabecera del usuario en el menú */}
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-xs text-gray-400 font-medium">Conectado como</p>
                    <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                    <p className="text-[11px] text-cyan-400 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-cyan-950/40 transition-colors"
                      onClick={closeDesktopMenu}
                    >
                      <span className="material-symbols-outlined text-base text-cyan-400">person</span>
                      <span>Mi Perfil</span>
                    </Link>
                    <Link
                      href="/mis-pedidos"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-cyan-950/40 transition-colors"
                      onClick={closeDesktopMenu}
                    >
                      <span className="material-symbols-outlined text-base text-cyan-400">local_shipping</span>
                      <span>Mis Pedidos</span>
                    </Link>
                    <Link
                      href="/cotizaciones"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-cyan-950/40 transition-colors"
                      onClick={closeDesktopMenu}
                    >
                      <span className="material-symbols-outlined text-base text-cyan-400">receipt_long</span>
                      <span>Mis Cotizaciones</span>
                    </Link>

                    {user.rol === 'admin' && (
                      <button
                        onClick={() => {
                          closeDesktopMenu();
                          router.push('/admin');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 transition-colors text-left cursor-pointer font-medium"
                      >
                        <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                        <span>Panel Administrador</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-gray-800">
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botón Menú Móvil */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/cotizar"
              className="text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">calculate</span>
              <span>Cotizar</span>
            </Link>

            <button
              ref={mobileButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-[#131b2e] border border-gray-800 text-gray-300 hover:text-white focus:outline-none transition-colors"
              aria-label="Abrir menú de navegación"
              aria-expanded={mobileMenuOpen}
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Menú Desplegable Móvil */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden fixed inset-x-4 top-22 z-50 bg-[#131b2e]/98 backdrop-blur-2xl border border-gray-800 rounded-3xl shadow-2xl p-5 space-y-4 max-h-[82vh] overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {/* Si está autenticado, card de perfil */}
          {user && (
            <div className="bg-[#0f1728] border border-gray-800 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user.nombre}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Enlaces de Navegación Principal */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block px-3 mb-1">Navegación</span>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg text-cyan-400">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <Link
              href="/cotizar"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === '/cotizar'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold shadow-md'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/40'
              }`}
            >
              <span className="material-symbols-outlined text-lg text-cyan-400">calculate</span>
              <span>Cotizador en Línea</span>
            </Link>
          </div>

          {/* Opciones de Cuenta */}
          <div className="pt-3 border-t border-gray-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block px-3 mb-1">Cuenta</span>
            {!user ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="text-center py-2.5 rounded-xl bg-gray-800 text-gray-200 font-semibold text-xs border border-gray-700"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={closeMobileMenu}
                  className="text-center py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                >
                  Registrarse
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/perfil"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60"
                >
                  <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                  <span>Mi Perfil</span>
                </Link>
                <Link
                  href="/mis-pedidos"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60"
                >
                  <span className="material-symbols-outlined text-lg text-gray-400">local_shipping</span>
                  <span>Mis Pedidos</span>
                </Link>
                <Link
                  href="/cotizaciones"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-800/60"
                >
                  <span className="material-symbols-outlined text-lg text-gray-400">receipt_long</span>
                  <span>Mis Cotizaciones</span>
                </Link>

                {user.rol === 'admin' && (
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      router.push('/admin');
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-950/30 text-left"
                  >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                    <span>Panel Administrador</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 text-left"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>Cerrar sesión</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notificación Toast flotante */}
      {message && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur-xl px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in fade-in zoom-in-95 duration-200">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{message}</span>
        </div>
      )}
    </nav>
  );
}

export default memo(Navbar);