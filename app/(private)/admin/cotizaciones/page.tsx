'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

interface Cotizacion {
  id: number;
  usuario_id?: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  fecha_cotizacion: string;
  subtotal: number;
  total: number;
  estado: string;
  codigo_unico: string;
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function AdminCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCotizacion, setSelectedCotizacion] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch('/api/admin/cotizaciones', {
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.error || `Error en la respuesta: ${res.status} ${res.statusText}`);
        setCotizaciones([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Datos de cotizaciones inválidos');
        setCotizaciones([]);
      } else {
        setCotizaciones(data);
      }
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  const verDetalles = async (codigo: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${codigo}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCotizacion(data);
        setShowModal(true);
      } else {
        alert('Error al cargar los detalles de la cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar los detalles');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCotizacion(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Cotizaciones</h1>
              <p className="text-gray-300 mt-1">Cargando cotizaciones desde la base de datos...</p>
            </div>
            <Link
              href="/admin"
              className="bg-primary hover:bg-secondary text-blue-600 px-4 py-2 rounded-md transition-colors"
            >
              Volver
            </Link>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="text-white text-xl">Cargando cotizaciones...</div>
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
            <h1 className="text-3xl font-bold text-white">Gestión de Cotizaciones</h1>
            <p className="text-gray-300 mt-1">Se muestran todas las cotizaciones de la base de datos.</p>
          </div>

          <Link
            href="/admin"
            className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors">
            Volver
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-900/30 border border-red-500 p-6 text-red-200">
            {error}
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ backgroundColor: '#1e2939' }}>
            <p className="text-gray-300 text-lg">No hay cotizaciones registradas</p>
          </div>
        ) : (
          <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Fecha
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
                  {cotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {cotizacion.codigo_unico}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cotizacion.nombre_cliente}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cotizacion.email_cliente}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${formatNumber(cotizacion.total)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            cotizacion.estado === 'vigente'
                              ? 'bg-green-900/50  text-green-300'
                              : cotizacion.estado === 'aprobada'
                              ? 'bg-blue-900/50  text-blue-300'
                              : cotizacion.estado === 'convertida'
                              ? 'bg-purple-900/50  text-purple-300'
                              : 'bg-red-900/50  text-red-300'
                          }`}
                        >
                          {cotizacion.estado}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => verDetalles(cotizacion.codigo_unico)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e2939'}}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Detalle de cotización</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 space-y-1 text-gray-200">
                <p><strong>Código:</strong> {selectedCotizacion.codigo_unico}</p>
                <p><strong>Cliente:</strong> {selectedCotizacion.nombre_cliente}</p>
                <p><strong>Email:</strong> {selectedCotizacion.email_cliente}</p>
                <p><strong>Teléfono:</strong> {selectedCotizacion.telefono_cliente}</p>
                <p><strong>Dirección:</strong> {selectedCotizacion.direccion_cliente}</p>
                <p><strong>Fecha:</strong> {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</p>
              </div>

              <h3 className="font-bold text-white mb-2">Productos</h3>
              <div className='overflow-x-auto'>
                <table className="w-full mb-4">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="p-2 text-left text-xs font-medium text-gray-300">Producto</th>
                      <th className="p-2 text-left text-xs font-medium text-gray-300">Medidas</th>
                      <th className="p-2 text-left text-xs font-medium text-gray-300">Cantidad</th>
                      <th className="p-2 text-left text-xs font-medium text-gray-300">Precio</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-700'>
                    {selectedCotizacion.detalles?.map((det: any, i: number) => (
                      <tr key={i} className="text-gray-200">
                        <td className="p-2">{det.descripcion}</td>
                        <td className="p-2">
                          {det.medida_largo && `${det.medida_largo}x${det.medida_ancho} cm`}
                        </td>
                        <td className="p-2">{det.cantidad}</td>
                        <td className="p-2">${formatNumber(det.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right pt-4 border-t border-gray-700">
                <p className="text-xl font-bold text-primary">Total: ${formatNumber(selectedCotizacion.total)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}