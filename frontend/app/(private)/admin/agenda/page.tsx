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
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Iniciando fetch de /api/admin/agenda...');
        const citasRes = await fetch('/api/admin/agenda', { credentials: 'include' });
        console.log('📍 Response status:', citasRes.status);
        console.log('📍 Response headers:', citasRes.headers);
        
        const usuariosRes = await fetch('/api/admin/usuarios', { credentials: 'include' });

        if (!citasRes.ok) {
          const citasError = await citasRes.json().catch(() => ({}));
          console.error('Error en /api/admin/agenda:', citasRes.status, citasError);
          console.log('Full response:', await citasRes.text().catch(() => 'Could not read text'));
          setError(`Error al cargar citas: ${citasRes.status} - ${JSON.stringify(citasError)}`);
          return;
        }

        if (!usuariosRes.ok) {
          const usuariosError = await usuariosRes.json().catch(() => ({}));
          console.error('Error en /api/admin/usuarios:', usuariosRes.status, usuariosError);
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

        {/* Tabla de citas */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          {citasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg">No hay citas para mostrar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                          className={`px-3 py-1 rounded text-sm font-medium ${estadoColores[cita.estado]} bg-transparent border border-current`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="realizada">Realizada</option>
                          <option value="cancelada">Cancelada</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEliminarCita(cita.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
