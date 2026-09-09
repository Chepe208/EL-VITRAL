'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

interface Usuario {
  id: number;
  nombre: string;
  email: string;
}

const tiposIconos: Record<string, string> = {
  entrega: '📦',
  consulta: '💬',
  medidas: '📐',
  pago: '💳',
  otro: '📅',
};

const estadoColores: Record<string, string> = {
  pendiente: 'bg-yellow-900 text-yellow-200',
  confirmada: 'bg-green-900 text-green-200',
  realizada: 'bg-blue-900 text-blue-200',
  cancelada: 'bg-red-900 text-red-200',
};

export default function AgendaAdminPage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [usuarios, setUsuarios] = useState<Record<number, Usuario>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState<string>('todas');
  const [mobileActionCita, setMobileActionCita] = useState<Cita | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const citasRes = await fetch('/api/admin/agenda', { credentials: 'include' });
        
        const usuariosRes = await fetch('/api/admin/usuarios', { credentials: 'include' });

        if (!citasRes.ok) {
          const citasError = await citasRes.json().catch(() => ({}));
          setError(`Error al cargar citas: ${citasRes.status} - ${JSON.stringify(citasError)}`);
          return;
        }

        if (!usuariosRes.ok) {
          setError(`Error al cargar usuarios: ${usuariosRes.status}`);
          return;
        }

        const citasData = await citasRes.json();
        const usuariosData = await usuariosRes.json();

        setCitas(citasData.sort((a: Cita, b: Cita) => new Date(b.fecha_cita).getTime() - new Date(a.fecha_cita).getTime()));
        
        const usuariosMap: Record<number, Usuario> = {};
        usuariosData.forEach((u: Usuario) => {
          usuariosMap[u.id] = u;
        });
        setUsuarios(usuariosMap);
      } catch (error) {
        console.error('Error cargando datos:', error);
        setError(`Error de conexión: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleActualizarEstado = async (citaId: number, nuevoEstado: string) => {
    try {
      const cita = citas.find(c => c.id === citaId);
      if (!cita) return;

      const body = {
        id: citaId,
        titulo: cita.titulo,
        fecha_cita: cita.fecha_cita,
        tipo: cita.tipo,
        notas: cita.notas || '',
        estado: nuevoEstado,
      };

      const res = await fetch('/api/agenda/citas', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setCitas(citas.map(c => c.id === citaId ? { ...c, estado: nuevoEstado as Cita['estado'] } : c));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error('Failed to update cita:', res.status, err);
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const handleEliminarCita = async (citaId: number) => {
    if (!confirm('¿Deseas eliminar esta cita?')) return;

    try {
      const res = await fetch('/api/agenda/citas', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: citaId }),
      });

      if (res.ok) {
        setCitas(citas.filter(c => c.id !== citaId));
      }
    } catch (error) {
      console.error('Error eliminando cita:', error);
    }
  };

  const citasFiltradas = filtro === 'todas' 
    ? citas 
    : citas.filter(c => c.estado === filtro);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828' }}>
        <div className="text-white text-xl">Cargando agenda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Agenda de Citas</h1>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Volver al Panel
            </Link>
          </div>
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <p className="text-red-400 text-lg">{error}</p>
            <p className="text-red-300 text-sm mt-2">Por favor, verifica la consola del navegador para más detalles.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Agenda de Citas</h1>
            <p className="text-gray-400 mt-2">Total de citas: {citas.length}</p>
          </div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800 p-4 rounded-lg mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'todas'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Todas ({citas.length})
          </button>
          <button
            onClick={() => setFiltro('pendiente')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'pendiente'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Pendiente ({citas.filter(c => c.estado === 'pendiente').length})
          </button>
          <button
            onClick={() => setFiltro('confirmada')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'confirmada'
                ? 'bg-green-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Confirmada ({citas.filter(c => c.estado === 'confirmada').length})
          </button>
          <button
            onClick={() => setFiltro('realizada')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'realizada'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Realizada ({citas.filter(c => c.estado === 'realizada').length})
          </button>
          <button
            onClick={() => setFiltro('cancelada')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filtro === 'cancelada'
                ? 'bg-red-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            Cancelada ({citas.filter(c => c.estado === 'cancelada').length})
          </button>
        </div>

        {/* Tabla / Tarjetas de citas */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {citasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg">No hay citas para mostrar</p>
            </div>
          ) : (
            <>
              {/* Vista de tarjetas para Móvil (< md) */}
              <div className="block md:hidden p-4 space-y-4">
                {citasFiltradas.map((cita) => (
                  <div key={cita.id} className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-md">
                    {/* Header de la tarjeta: Tipo y Estado */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 text-gray-300 text-xs font-semibold border border-slate-700">
                        <span>{tiposIconos[cita.tipo]}</span>
                        <span className="capitalize">{cita.tipo}</span>
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${estadoColores[cita.estado]}`}>
                        {cita.estado}
                      </span>
                    </div>

                    {/* Título y Descripción */}
                    <div>
                      <h3 className="text-white font-bold text-base leading-snug">{cita.titulo}</h3>
                      {cita.descripcion && (
                        <p className="text-xs text-gray-400 mt-1 break-words">{cita.descripcion}</p>
                      )}
                    </div>

                    {/* Usuario y Correo */}
                    <div className="text-xs border-t border-slate-800 pt-2.5 space-y-1">
                      <p className="text-gray-200 font-medium">
                        <span className="text-gray-400">Usuario: </span>
                        {usuarios[cita.usuario_id]?.nombre || 'Usuario'}
                      </p>
                      {usuarios[cita.usuario_id]?.email && (
                        <p className="text-gray-400 truncate">
                          <span className="text-gray-400">Email: </span>
                          {usuarios[cita.usuario_id]?.email}
                        </p>
                      )}
                    </div>

                    {/* Fecha y Hora */}
                    <div className="text-xs text-gray-300 flex items-center gap-1.5 pt-1">
                      <span>📅</span>
                      <span>
                        {new Date(cita.fecha_cita).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Botón Acciones */}
                    <div className="pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => setMobileActionCita(cita)}
                        className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gray-700 hover:bg-gray-600 px-4 py-2.5 text-white transition-colors border border-gray-600 font-semibold text-sm shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">settings</span>
                        Acciones
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista de Tabla para Escritorio y Tablet (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Tipo</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Título</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Usuario</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Fecha</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Estado</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasFiltradas.map((cita) => (
                      <tr key={cita.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition">
                        <td className="px-6 py-4 text-gray-300">{tiposIconos[cita.tipo]} {cita.tipo}</td>
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{cita.titulo}</div>
                          {cita.descripcion && (
                            <div className="text-sm text-gray-400">{cita.descripcion}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{usuarios[cita.usuario_id]?.nombre || 'Usuario'}</div>
                          <div className="text-sm text-gray-400">{usuarios[cita.usuario_id]?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {new Date(cita.fecha_cita).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={cita.estado}
                            onChange={(e) => handleActualizarEstado(cita.id, e.target.value)}
                            className={`px-3 py-2 rounded text-sm font-medium ${estadoColores[cita.estado]} bg-transparent border border-current w-full min-h-[44px]`}
                          >
                            <option value="pendiente" className="bg-slate-800 text-white">Pendiente</option>
                            <option value="confirmada" className="bg-slate-800 text-white">Confirmada</option>
                            <option value="realizada" className="bg-slate-800 text-white">Realizada</option>
                            <option value="cancelada" className="bg-slate-800 text-white">Cancelada</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="hidden md:block">
                            <button
                              onClick={() => handleEliminarCita(cita.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                          <div className="md:hidden">
                            <button
                              onClick={() => setMobileActionCita(cita)}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-white transition-colors border border-gray-600"
                            >
                              <span className="material-symbols-outlined text-sm">settings</span>
                              Acciones
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de acciones para móvil */}
      {mobileActionCita && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="rounded-2xl shadow-2xl w-full max-w-md mx-auto my-auto overflow-hidden border border-slate-700" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-5 sm:p-6">
              <div className="flex justify-between items-center mb-5 border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Acciones de Cita</h2>
                  <p className="text-gray-400 text-sm truncate max-w-[220px]">{mobileActionCita.titulo}</p>
                </div>
                <button
                  onClick={() => setMobileActionCita(null)}
                  className="text-gray-400 hover:text-gray-200 text-3xl min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-medium">Cambiar Estado</label>
                  <select
                    value={mobileActionCita.estado}
                    onChange={(e) => {
                      handleActualizarEstado(mobileActionCita.id, e.target.value);
                      setMobileActionCita({ ...mobileActionCita, estado: e.target.value as Cita['estado'] });
                    }}
                    className={`w-full min-h-[48px] px-3 py-2 rounded-xl font-medium ${estadoColores[mobileActionCita.estado]} bg-transparent border border-current outline-none`}
                  >
                    <option value="pendiente" className="bg-slate-800 text-white">Pendiente</option>
                    <option value="confirmada" className="bg-slate-800 text-white">Confirmada</option>
                    <option value="realizada" className="bg-slate-800 text-white">Realizada</option>
                    <option value="cancelada" className="bg-slate-800 text-white">Cancelada</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => {
                      handleEliminarCita(mobileActionCita.id);
                      setMobileActionCita(null);
                    }}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 text-red-400 bg-red-900/30 hover:bg-red-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-red-800/50"
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Eliminar Cita
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
