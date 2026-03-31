'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';

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
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
    if (!confirm('¿Estás seguro de que quieres convertir esta cotización en pedido?')) {
      return;
    }

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cotizacion_id: cotizacionId,
          fecha_entrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 días después
        })
      });

      if (res.ok) {
        alert('Cotización convertida a pedido exitosamente');
        fetchCotizaciones(); 
      } else {
        const error = await res.json();
        alert(error.error || 'Error al convertir la cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex items-center justify-center py-12">
          <div className="text-xl">Cargando cotizaciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Mis Cotizaciones</h1>

        {cotizaciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No tienes cotizaciones realizadas</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {cotizacion.codigo_unico}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cotizacion.nombre_cliente}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${parseFloat(cotizacion.total.toString()).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          cotizacion.estado === 'vigente'
                            ? 'bg-green-100 text-green-800'
                            : cotizacion.estado === 'aprobada'
                            ? 'bg-blue-100 text-blue-800'
                            : cotizacion.estado === 'convertida'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cotizacion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {cotizacion.estado !== 'convertida' && (
                          <button
                            onClick={() => convertirAPedido(cotizacion.id)}
                            className="text-primary hover:text-primary-dark mr-4"
                          >
                            Convertir a Pedido
                          </button>
                        )}
                        <button
                          onClick={() => verDetalles(cotizacion.codigo_unico)}
                          className="text-blue-600 hover:text-blue-900"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detalle de cotización</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>

              <div className="mb-4">
                <p><strong>Código:</strong> {selectedCotizacion.codigo_unico}</p>
                <p><strong>Cliente:</strong> {selectedCotizacion.nombre_cliente}</p>
                <p><strong>Email:</strong> {selectedCotizacion.email_cliente}</p>
                <p><strong>Teléfono:</strong> {selectedCotizacion.telefono_cliente || 'No especificado'}</p>
                <p><strong>Fecha:</strong> {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</p>
                <p><strong>Estado:</strong> {selectedCotizacion.estado}</p>
              </div>

              <h3 className="font-bold mb-2">Productos</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-xs">Descripción</th>
                      <th className="p-2 text-xs">Medidas</th>
                      <th className="p-2 text-xs">Cantidad</th>
                      <th className="p-2 text-xs">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCotizacion.detalles?.map((det, i) => (
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

              <div className="text-right">
                <p className="text-xl font-bold">Total: ${Number(selectedCotizacion.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}