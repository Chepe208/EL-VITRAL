'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

interface Pedido {
  id: number;
  cotizacion_id?: number;
  usuario_id: number;
  fecha_pedido: string;
  fecha_entrega?: string;
  estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
  total: number;
  notas?: string;
}

const estadosOrdenados: Array<Pedido['estado']> = [
  'pendiente',
  'en_proceso',
  'listo',
  'entregado'
];

const etiquetasEstado: Record<Pedido['estado'], string> = {
  pendiente: 'Pendientes',
  en_proceso: 'En proceso',
  listo: 'Listos',
  entregado: 'Entregados'
};

const colorEstado: Record<Pedido['estado'], string> = {
  pendiente: 'bg-yellow-900/50 text-yellow-300',
  en_proceso: 'bg-blue-900/50 text-blue-300',
  listo: 'bg-green-900/50 text-green-300',
  entregado: 'bg-gray-700 text-gray-300'
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits:0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      const res = await fetch('/api/admin/pedidos', {
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.error || `Error en la respuesta: ${res.status} ${res.statusText}`);
        setPedidos([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Datos de pedidos inválidos');
        setPedidos([]);
      } else {
        setPedidos(data);
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
      setError('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (pedidoId: number, nuevoEstado: string) => {
    try {
      const res = await fetch(`/api/admin/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (res.ok) {
        fetchPedidos();
      } else {
        const error = await res.json().catch(() => null);
        alert(error?.error || 'Error al actualizar el estado del pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const pedidosPorEstado = useMemo(() => {
    return estadosOrdenados.reduce<Record<Pedido['estado'], Pedido[]>>((acc, estado) => {
      acc[estado] = pedidos.filter((pedido) => pedido.estado === estado);
      return acc;
    }, {
      pendiente: [],
      en_proceso: [],
      listo: [],
      entregado: []
    });
  }, [pedidos]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Pedidos</h1>
              <p className="text-gray-300 mt-1">Cargando pedidos desde la base de datos...</p>
            </div>
            <Link
              href="/admin"
              className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors"
            >
              Volver
            </Link>
          </div>

          <div className="flex items-center justify-center py-16">
            <div className="text-white text-xl">Cargando pedidos...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Pedidos</h1>
            <p className="text-gray-300 mt-1">
              Los pedidos están divididos por estado y se pueden actualizar desde aquí.
            </p>
          </div>

          <Link
            href="/admin"
            className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors"
          >
            Volver
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-900/50 border border-red-500 p-6 text-red-200">
            {error}
          </div>
        ) : pedidos.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ backgroundColor: '#1e2939'}}>
            <p className="text-gray-500 text-lg">No hay pedidos registrados</p>
          </div>
        ) : (
          <div className="space-y-8">
            {estadosOrdenados.map((estado) => {
              const pedidosEstado = pedidosPorEstado[estado];

              return (
                <section key={estado} className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
                    <div>
                      <h2 className="text-xl font-bold text-white">{etiquetasEstado[estado]}</h2>
                      <p className="text-sm text-gray-300">{pedidosEstado.length} pedido(s)</p>
                    </div>

                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colorEstado[estado]}`}>
                      {estado}
                    </span>
                  </div>

                  {pedidosEstado.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      No hay pedidos en este estado.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Fecha Pedido
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Fecha Entrega
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-700">
                          {pedidosEstado.map((pedido) => (
                            <tr key={pedido.id} className="hover:bg-gray-800/50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                #{pedido.id}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(pedido.fecha_pedido).toLocaleDateString()}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {pedido.fecha_entrega
                                  ? new Date(pedido.fecha_entrega).toLocaleDateString()
                                  : 'No definida'}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                ${formatNumber(pedido.total)}
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${colorEstado[pedido.estado]}`}
                                >
                                  {pedido.estado}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <select
                                  value={pedido.estado}
                                  onChange={(e) => actualizarEstado(pedido.id, e.target.value)}
                                  className="rounded-md border border-gray-600 bg-gray-800 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                  <option value="pendiente">Pendiente</option>
                                  <option value="en_proceso">En proceso</option>
                                  <option value="listo">Listo</option>
                                  <option value="entregado">Entregado</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}