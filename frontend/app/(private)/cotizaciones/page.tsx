'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Cotizacion {
  id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  fecha_cotizacion: string;
  subtotal: number;
  total: number;
  estado: string;
  codigo_unico: string;
  detalles?: Array<{
    descripcion: string;
    medida_largo?: number;
    medida_ancho?: number;
    cantidad: number;
    subtotal: number;
  }>;
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch('/api/cotizaciones');
      if (res.ok) {
        const data = await res.json();
        setCotizaciones(data);
      }
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertirAPedido = async (cotizacionId: number) => {
    setShowPhoneModal(true);
  };

  const verDetalles = async (codigo: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/cotizaciones/${encodeURIComponent(codigo)}`);
      if (!res.ok) {
        alert('No se pudieron cargar los detalles de la cotización');
        return;
      }
      const data = await res.json();
      setSelectedCotizacion(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      alert('Error al cargar detalles');
    } finally {
      setLoadingDetails(false);
    }
  };

  const descargarPdfCotizacion = (codigo: string) => {
    const url = `/api/cotizaciones/${encodeURIComponent(codigo)}/pdf`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828'}}>
          <div className="text-white text-xl">Cargando cotizaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style= {{ backgroundColor: '#101828'}}>
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Mis Cotizaciones</h1>

        {cotizaciones.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ backgroundColor: '#1e2939'}}>
            <p className="text-gray-300 text-lg">No tienes cotizaciones realizadas</p>
          <Link href="/catalogo" className="inline-block mt-4 bg-primary text-blue-400 px-6 py-2 rounded-md hover:bg-secondary transition-colors">
              Explorar productos
          </Link>
        </div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
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
                        {new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${formatNumber(cotizacion.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cotizacion.estado === 'vigente'
                            ? 'bg-green-900/50 text-green-300'
                            : cotizacion.estado === 'aprobada'
                            ? 'bg-blue-900/50 text-blue-300'
                            : cotizacion.estado === 'convertida'
                            ? 'bg-purple-900/50 text-purple-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}>
                          {cotizacion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {cotizacion.estado !== 'convertida' && (
                          <button
                            onClick={() => convertirAPedido(cotizacion.id)}
                            className="text-primary hover:text-secondary"
                          >
                            Llama para confirmar
                          </button>
                        )}
                        <button
                          onClick={() => descargarPdfCotizacion(cotizacion.codigo_unico)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Descargar PDF
                        </button>
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

      {showModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#1e2939'}}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Detalle de cotización</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 text-2xl">×</button>
              </div>

              <div className="mb-4">
                <p><strong>Código:</strong> {selectedCotizacion.codigo_unico}</p>
                <p><strong>Cliente:</strong> {selectedCotizacion.nombre_cliente}</p>
                <p><strong>Email:</strong> {selectedCotizacion.email_cliente}</p>
                <p><strong>Teléfono:</strong> {selectedCotizacion.telefono_cliente || 'No especificado'}</p>
                <p><strong>Fecha:</strong> {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</p>
                <p><strong>Estado:</strong> {selectedCotizacion.estado}</p>
              </div>

              <h3 className="font-bold text-white mb-2">Productos</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="p-2 text-xs font-medium text-gray-300">Descripción</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Medidas</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Cantidad</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Precio</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-700'>
                    {selectedCotizacion.detalles?.map((det: any, i: number) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{det.descripcion}</td>
                        <td className="p-2">{det.medida_largo && det.medida_ancho ? `${det.medida_largo}x${det.medida_ancho} cm` : 'No aplica'}</td>
                        <td className="p-2">{det.cantidad}</td>
                        <td className="p-2">${Number(det.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-right pt-4 border-t border-gray-700">
                <p className="text-xl font-bold text-primary">Total: ${formatNumber(selectedCotizacion.total)}</p>
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => descargarPdfCotizacion(selectedCotizacion.codigo_unico)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Descargar PDF
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: '#1e2939'}}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Confirmar Tu Cotización</h2>
                <button onClick={() => setShowPhoneModal(false)} className="text-gray-400 hover:text-gray-200 text-2xl">×</button>
              </div>

              <div className="text-center py-8">
                <p className="text-gray-300 mb-6 text-lg">Para confirmar tu cotización, por favor llama al siguiente número:</p>
                <div className="bg-primary bg-opacity-20 border border-primary rounded-lg p-6 mb-6">
                  <p className="text-4xl font-bold text-primary">3137928483</p>
                </div>
                <p className="text-gray-400 text-sm">Nuestro equipo está disponible para asistirte</p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}