'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  direccion?: string;
}

export default function EditarPerfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        setError('No se pudo cargar la información del usuario.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          direccion: user.direccion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar tu perfil.');
        return;
      }

      setSuccess('Perfil actualizado correctamente.');
      setTimeout(() => router.push('/perfil'), 1500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-10 text-center shadow-2xl">
            <p className="text-white">Cargando información...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-sky-400">Editar perfil</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Actualiza tus datos</h1>
              </div>
              <Link
                href="/perfil"
                className="inline-flex items-center justify-center rounded-3xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
              >
                Volver al perfil
              </Link>
            </div>

            {error && (
              <div className="rounded-3xl border border-red-600/30 bg-red-600/10 p-4 text-sm text-red-200 mb-6">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-3xl border border-emerald-600/30 bg-emerald-600/10 p-4 text-sm text-emerald-200 mb-6">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Nombre</span>
                  <input
                    value={user?.nombre ?? ''}
                    onChange={(e) => setUser((prev) => prev ? { ...prev, nombre: e.target.value } : prev)}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Correo</span>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    onChange={(e) => setUser((prev) => prev ? { ...prev, email: e.target.value } : prev)}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Teléfono</span>
                  <input
                    value={user?.telefono ?? ''}
                    onChange={(e) => setUser((prev) => prev ? { ...prev, telefono: e.target.value } : prev)}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">Dirección</span>
                  <input
                    value={user?.direccion ?? ''}
                    onChange={(e) => setUser((prev) => prev ? { ...prev, direccion: e.target.value } : prev)}
                    className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
                <p className="text-slate-400">Recuerda mantener tus datos actualizados para recibir cotizaciones más rápidas y precisas.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-3xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
