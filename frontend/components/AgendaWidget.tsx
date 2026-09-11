'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

function AgendaWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha_cita: '',
    tipo: 'otro' as Cita['tipo'],
    notas: '',
  });

  const getMinDateTimeLocal = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchCitas = useCallback(async () => {
    const res = await fetch('/api/agenda/citas', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setCitas(data.sort((a: Cita, b: Cita) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime()));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetch('/api/agenda/citas', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setCitas(data.sort((a: Cita, b: Cita) => new Date(a.fecha_cita).getTime() - new Date(b.fecha_cita).getTime()));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.fecha_cita) {
      alert('Por favor completa los campos obligatorios');
      return;
    }

    const selected = new Date(formData.fecha_cita);
    const now = new Date();
    if (selected.getTime() < now.getTime()) {
      alert('La fecha de la cita no puede ser anterior a la fecha actual');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fecha_cita: new Date(formData.fecha_cita).toISOString(),
        }),
      });

      if (res.ok) {
        setFormData({
          titulo: '',
          descripcion: '',
          fecha_cita: '',
          tipo: 'otro',
          notas: '',
        });
        setShowForm(false);
        fetchCitas();
      } else {
        alert('Error al crear la cita');
      }
    } catch (error) {
      console.error('Error creando cita:', error);
      alert('Error al crear la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCita = async (citaId: number) => {
    if (!confirm('¿Deseas eliminar esta cita?')) return;

    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: citaId }),
      });

      if (res.ok) {
        fetchCitas();
      }
    } catch (error) {
      console.error('Error eliminando cita:', error);
    }
  };

  if (pathname === '/admin/agenda') {
    return null;
  }

  if (!user) {
    return null;
  }

  const citasProximas = citas.filter((c) => new Date(c.fecha_cita) > new Date());

  return (
    <div className={`fixed bottom-36 sm:bottom-32 lg:bottom-6 right-3 sm:right-4 lg:right-4 ${isOpen ? 'z-50' : 'z-40'}`}>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-3.5 sm:p-4 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="Abrir agenda"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {/* Agenda Modal */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm max-h-[calc(100vh-10rem)] sm:max-h-[32rem] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white p-3.5 sm:p-4 rounded-t-2xl flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-sm sm:text-base text-white truncate">Mi Agenda</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-emerald-700 rounded-lg p-1.5 transition-colors text-sm font-bold ml-2 flex items-center justify-center min-w-[28px] min-h-[28px]"
              title="Cerrar agenda"
            >
              ✕
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
            {!showForm ? (
              <div>
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium mb-4 text-xs sm:text-sm transition-colors shadow-sm"
                >
                  + Nueva Cita
                </button>

                {citasProximas.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <p className="text-xs sm:text-sm">No tienes citas próximas</p>
                    <p className="text-xs mt-2 text-slate-500">Agenda una ahora mismo</p>
                    <Link
                      href="/perfil/agenda"
                      className="block w-full text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium mt-4 text-xs sm:text-sm transition-colors"
                    >
                      Ver todas mis citas
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasProximas.slice(0, 3).map((cita) => (
                      <div key={cita.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="shrink-0">{tiposIconos[cita.tipo]}</span>
                              <p className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm truncate">{cita.titulo}</p>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              📅 {new Date(cita.fecha_cita).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                            {cita.descripcion && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 break-words">{cita.descripcion}</p>
                            )}
                            <span className={`inline-block text-[11px] mt-2 px-2 py-0.5 rounded-md ${
                              cita.estado === 'confirmada'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200'
                            }`}>
                              {cita.estado}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCita(cita.id)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 shrink-0 ml-1"
                            title="Eliminar cita"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {citasProximas.length > 3 && (
                      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                        +{citasProximas.length - 3} más
                      </p>
                    )}
                    <Link
                      href="/perfil/agenda"
                      className="block w-full text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 px-4 py-2.5 rounded-xl font-medium mt-3 text-xs sm:text-sm transition-colors"
                    >
                      Ver todas mis citas
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Ej: Entrega de proyecto"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha y Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_cita}
                    onChange={(e) => setFormData({ ...formData, fecha_cita: e.target.value })}
                    min={getMinDateTimeLocal()}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0 max-w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as Cita['tipo'] })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
                  >
                    <option value="otro">Otro</option>
                    <option value="entrega">Entrega</option>
                    <option value="consulta">Consulta</option>
                    <option value="medidas">Medidas</option>
                    <option value="pago">Pago</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Detalles adicionales..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-w-0"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2 sticky bottom-0 bg-slate-50 dark:bg-slate-900 py-2 border-t border-slate-200/50 dark:border-slate-700/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs sm:text-sm font-medium transition-colors min-h-[38px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[38px]"
                  >
                    {loading ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(AgendaWidget);
