'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function EditarPerfilPage() {
  const { user, loading, refreshUser } = useAuth();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', direccion: '' });
  const [lastUserId, setLastUserId] = useState<number | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  if (user?.id !== lastUserId) {
    setLastUserId(user?.id ?? null);
    if (user) {
      setForm({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
      });
    }
  }

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
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo actualizar tu perfil.');
        return;
      }

      setSuccess('Perfil actualizado correctamente.');
      refreshUser();
      setTimeout(() => router.push('/perfil'), 1500);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 text-center shadow-2xl w-full max-w-sm">
          <p className="text-white">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl shadow-slate-950/20">

          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-sky-400">Editar perfil</p>
              <h1 className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-semibold text-white">Actualiza tus datos</h1>
            </div>
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 self-start sm:self-auto min-h-[44px]"
            >
              <span className="material-symbols-outlined mr-1 text-base">arrow_back</span>
              Volver al perfil
            </Link>
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-2xl border border-red-600/30 bg-red-600/10 p-4 text-sm text-red-200 mb-5 sm:mb-6">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-600/30 bg-emerald-600/10 p-4 text-sm text-emerald-200 mb-5 sm:mb-6">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Nombre</span>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm sm:text-base min-h-[44px]"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Correo</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm sm:text-base min-h-[44px]"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Teléfono</span>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm(prev => ({ ...prev, telefono: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm sm:text-base min-h-[44px]"
                  placeholder="Opcional"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-300">Dirección</span>
                <input
                  value={form.direccion}
                  onChange={(e) => setForm(prev => ({ ...prev, direccion: e.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-sm sm:text-base min-h-[44px]"
                  placeholder="Opcional"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6">
              <p className="text-slate-400 text-sm sm:text-base">Recuerda mantener tus datos actualizados para recibir cotizaciones más rápidas y precisas.</p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-70 min-h-[48px]"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
