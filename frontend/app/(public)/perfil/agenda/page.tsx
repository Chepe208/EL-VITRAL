'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface Cita {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  fecha_cita: string;
  tipo: 'entrega' | 'consulta' | 'medidas' | 'pago' | 'otro';
  estado: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada';
  notas: string;
  fecha_creacion: string;
}

const tiposIconos: Record<string, string> = {
  entrega: '📦',
  consulta: '💬',
  medidas: '📐',
  pago: '💳',
  otro: '📅',
};

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const horasDisponibles = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
];

function fechaParaDisplay(fecha: string) {
  const d = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(d.getTime())) return fecha;
  return `${diasSemana[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

const estadoColores: Record<string, string> = {
  pendiente: 'bg-yellow-900 text-yellow-200',
  confirmada: 'bg-green-900 text-green-200',
  realizada: 'bg-blue-900 text-blue-200',
  cancelada: 'bg-red-900 text-red-200',
};

export default function MiAgendaPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('todas');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_cita: '',
    hora_cita: '10:00',
    tipo: 'otro' as Cita['tipo'],
    notas: '',
  });

  const fetchCitas = useCallback(async () => {
    const res = await fetch('/api/agenda/citas', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCitas(data.sort((a: Cita, b: Cita) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime()));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    let cancelled = false;
    fetch('/api/agenda/citas', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setCitas(data.sort((a: Cita, b: Cita) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime()));
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar tus citas.');
      })
      .finally(() => {
        if (!cancelled) setLoadingCitas(false);
      });
    fetch('/api/agenda/dias-disponibles', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) {
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const dias = (Array.isArray(data) ? data : []).filter((d: string) => {
            const f = new Date(`${d}T12:00:00`);
            return !Number.isNaN(f.getTime()) && f.getDay() !== 0 && f.getDay() !== 6 && f.getTime() >= hoy.getTime();
          });
          setDiasDisponibles(dias);
          setFormData((prev) => ({ ...prev, fecha_cita: prev.fecha_cita || (dias[0] || '') }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.titulo.trim() || !formData.fecha_cita || !formData.hora_cita) {
      setError('Por favor completa el título, el día y la hora de la cita.');
      return;
    }
    const selected = new Date(`${formData.fecha_cita}T${formData.hora_cita}:00`);
    if (selected.getTime() < Date.now()) {
      setError('La hora de la cita no puede ser anterior a la fecha y hora actual.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          titulo: formData.titulo.trim(),
          fecha_cita: selected.toISOString(),
        }),
      });
      if (res.ok) {
        setFormData({ titulo: '', descripcion: '', fecha_cita: diasDisponibles[0] || '', hora_cita: '10:00', tipo: 'otro', notas: '' });
        setShowForm(false);
        await fetchCitas();
        setError('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al crear la cita.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCita = async (citaId: number) => {
    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: citaId }),
      });
      if (res.ok) {
        setCitas(prev => prev.filter(c => c.id !== citaId));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al eliminar la cita.');
      }
    } catch {
      setError('Error de conexión al eliminar la cita.');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center text-gray-400 text-xs">
        Cargando agenda...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center text-gray-400 text-xs">
        Redirigiendo...
      </div>
    );
  }

  const citasFiltradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro);

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-cyan-400">Mi agenda</p>
            <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-white">Tus citas programadas</h1>
            <p className="mt-2 text-sm text-gray-400">Todas las citas asociadas a tu cuenta.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(v => !v)}
              className="rounded-xl bg-cyan-600 hover:bg-cyan-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all shadow-lg shadow-cyan-950/50 min-h-[44px]"
            >
              {showForm ? 'Cerrar formulario' : '+ Nueva Cita'}
            </button>
            <Link
              href="/perfil"
              className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all min-h-[44px]"
            >
              Volver al perfil
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-cyan-800/40 bg-cyan-950/30 p-4 text-xs text-cyan-200/90 leading-relaxed">
          <span className="font-semibold text-cyan-200">Reglas de agenda:</span> Solo se pueden agendar citas de lunes a viernes,
          entre las 8:00 a. m. y las 5:00 p. m., y únicamente en las fechas habilitadas por el administrador.
          Después de crear una cita deberás esperar 20 minutos antes de poder agendar otra.
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-gray-800 bg-[#161f30] p-5 sm:p-6 space-y-4 shadow-2xl">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Entrega de proyecto"
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Día disponible *</label>
              <select
                value={formData.fecha_cita}
                onChange={e => setFormData({ ...formData, fecha_cita: e.target.value })}
                disabled={diasDisponibles.length === 0}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              >
                {diasDisponibles.length === 0 ? (
                  <option value="">Sin fechas disponibles</option>
                ) : (
                  diasDisponibles.map(dia => (
                    <option key={dia} value={dia}>{fechaParaDisplay(dia)}</option>
                  ))
                )}
              </select>
              {diasDisponibles.length === 0 && (
                <p className="mt-1 text-xs text-yellow-400">
                  El administrador aún no ha habilitado fechas. Solo podrás agendar en los días que se habiliten.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Hora (8:00 a. m. a 5:00 p. m.) *</label>
              <select
                value={formData.hora_cita}
                onChange={e => setFormData({ ...formData, hora_cita: e.target.value })}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                {horasDisponibles.map(hora => (
                  <option key={hora} value={hora}>{hora}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Tipo</label>
              <select
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as Cita['tipo'] })}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="otro">Otro</option>
                <option value="consulta">Consulta</option>
                <option value="medidas">Medidas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={2}
                className="w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-white text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all min-h-[44px]"
              >
                {saving ? 'Creando...' : 'Guardar cita'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-gray-700 bg-gray-900/80 hover:bg-gray-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-200 transition-all min-h-[44px]"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Filtros */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['todas', 'pendiente', 'confirmada', 'realizada', 'cancelada'] as const).map(estado => {
            const count = estado === 'todas' ? citas.length : citas.filter(c => c.estado === estado).length;
            return (
              <button
                key={estado}
                onClick={() => setFiltro(estado)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === estado
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-900/80 text-gray-300 hover:bg-gray-800 border border-gray-800'
                }`}
              >
                {estado[0].toUpperCase() + estado.slice(1)} ({count})
              </button>
            );
          })}
        </div>

        {loadingCitas ? (
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-8 text-center text-gray-400 text-sm animate-pulse">
            Cargando citas...
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-10 text-center">
            <span className="text-3xl block mb-2">🗓️</span>
            <p className="text-sm font-medium text-gray-200 mb-1">No tienes citas en esta vista</p>
            <p className="text-xs text-gray-400">Puedes crear una nueva cita o cambiar el filtro.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {citasFiltradas.map(cita => (
              <div key={cita.id} className="rounded-2xl border border-gray-800 bg-[#161f30] p-4 sm:p-5 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{tiposIconos[cita.tipo]}</span>
                    <h3 className="font-bold text-white text-sm truncate">{cita.titulo}</h3>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${estadoColores[cita.estado] || 'bg-gray-800 text-gray-300'}`}>
                    {cita.estado}
                  </span>
                </div>
                {cita.descripcion && (
                  <p className="mt-2 text-xs text-gray-400 break-words">{cita.descripcion}</p>
                )}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-900/80 border border-gray-800 px-2.5 py-1.5 text-xs text-gray-200">
                  📅 {new Date(cita.fecha_cita).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-end">
                  {confirmDeleteId === cita.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">¿Eliminar esta cita?</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleDeleteCita(cita.id)}
                        className="text-xs text-rose-300 hover:text-rose-200 bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        Sí, eliminar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(cita.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}