'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  direccion?: string;
}

export default function PerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        setError('No se pudo cargar el usuario.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-200">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500">{error || 'Usuario no encontrado'}</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-500 text-4xl font-bold text-white shadow-lg shadow-sky-500/20">
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Bienvenido</p>
                  <h1 className="mt-2 text-3xl font-semibold text-white">{user.nombre}</h1>
                </div>
                <span className="rounded-full bg-slate-800 px-4 py-2 text-sm uppercase tracking-[0.2em] text-slate-300">
                  {user.rol}
                </span>
              </div>

              <div className="mt-10 space-y-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Correo electrónico</p>
                  <p className="mt-2 text-base font-medium text-white">{user.email}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Teléfono</p>
                  <p className="mt-2 text-base font-medium text-white">{user.telefono || 'No registrado'}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                  <p className="text-sm text-slate-400">Dirección</p>
                  <p className="mt-2 text-base font-medium text-white">{user.direccion || 'No registrada'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20">
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-sky-400 mb-3">Detalles de la cuenta</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                      <p className="text-sm text-slate-400">ID de usuario</p>
                      <p className="mt-2 text-lg font-semibold text-white">{user.id}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                      <p className="text-sm text-slate-400">Último acceso</p>
                      <p className="mt-2 text-lg font-semibold text-white">Hoy</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-800 bg-slate-950/80 p-6">
                  <h2 className="text-xl font-semibold text-white mb-3">Tu espacio está listo</h2>
                  <p className="text-slate-400 leading-7">
                    Puedes revisar tus cotizaciones, actualizar tus datos y mantener tu cuenta segura. Si deseas cambiar tu información de contacto, contáctanos y te apoyamos.</p>
                </div>

              </div>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link href="/perfil/editar" className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white text-center transition hover:border-slate-500">
              Editar perfil
            </Link>
            <Link href="/cotizaciones" className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-sm font-semibold text-white text-center transition hover:border-slate-500">
              Ver mis cotizaciones
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
