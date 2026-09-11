'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function PerfilPage() {
  const { user, loading } = useAuth();
  const [error] = useState('');
  const [showId, setShowId] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center text-gray-400 text-xs">
        Cargando perfil...
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center text-rose-400 text-xs">
        {error || 'Usuario no encontrado'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Tarjeta Lateral - Información del Usuario */}
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-2xl font-bold shadow-lg shadow-cyan-950/50">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                    Bienvenido
                  </span>
                  <h1 className="text-xl font-bold text-white mt-1">{user.nombre}</h1>
                </div>
                <span className="rounded-full bg-gray-900 border border-gray-700/80 px-3 py-1 text-[10px] uppercase tracking-wider text-gray-300 font-semibold">
                  {user.rol}
                </span>
              </div>
              <div className="mt-8 space-y-3">
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5">
                  <p className="text-[10px] text-gray-400">Correo electrónico</p>
                  <p className="text-xs font-medium text-white truncate mt-0.5">{user.email}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5">
                  <p className="text-[10px] text-gray-400">Teléfono</p>
                  <p className="text-xs font-medium text-white mt-0.5">{user.telefono || 'No registrado'}</p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5">
                  <p className="text-[10px] text-gray-400">Dirección</p>
                  <p className="text-xs font-medium text-white mt-0.5">{user.direccion || 'No registrada'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Principal - Detalles y Opciones */}
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-6 sm:p-8 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase block mb-3">
                  Detalles de la cuenta
                </span>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* ID de usuario con botón para mostrar/ocultar */}
                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">ID de usuario</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {showId ? `#${user.id}` : '••••••••'}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowId(!showId)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 px-2.5 py-1 rounded-lg transition-colors"
                      title={showId ? 'Ocultar ID' : 'Mostrar ID'}
                    >
                      {showId ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                    <p className="text-[10px] text-gray-400">Último acceso</p>
                    <p className="text-sm font-semibold text-white mt-0.5">Hoy</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
                <h2 className="text-sm font-bold text-white mb-2">Tu espacio está listo</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Puedes revisar tus cotizaciones, actualizar tus datos y mantener tu cuenta segura. Si deseas cambiar tu información de contacto, contáctanos y te apoyamos.
                </p>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t border-gray-800">
              <Link 
                href="/perfil/editar" 
                className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 py-2.5 text-xs font-semibold text-white transition-all text-center"
              >
                Editar perfil
              </Link>
<Link
                href="/cotizaciones"
                className="flex items-center justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-semibold text-white transition-all shadow-lg shadow-cyan-950/50 text-center"
              >
                Ver mis cotizaciones
              </Link>
            </div>

            {/* Agenda */}
            <div className="grid gap-3 sm:grid-cols-2 pt-4 border-t border-gray-800">
              <Link
                href="/perfil/agenda"
                className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 py-2.5 text-xs font-semibold text-white transition-all text-center"
              >
                Mi agenda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
