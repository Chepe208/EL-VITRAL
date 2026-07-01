'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PedidoDetalle {
  id: number;
  cotizacion_id: number;
  producto_id: number;
  descripcion: string;
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string;
  producto_tipo?: string;
}

interface Pedido {
  id: number;
  cotizacion_id?: number;
  fecha_pedido: string;
  fecha_entrega?: string;
  total: number;
  estado: string;
  detalles?: PedidoDetalle[];
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetch('/api/pedidos', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          return [];
        }
        return res.json();
      })
      .then(data => {
        setPedidos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPedidos([]);
        setLoading(false);
      });
  }, []);

  const verDetallesPedido = async (pedidoId: number) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, { credentials: 'include' });
      if (!res.ok) {
        alert('No se pudo cargar el detalle del pedido');
        return;
      }

      const pedido = await res.json();
      setSelectedPedido(pedido);
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar detalle del pedido:', error);
      alert('Error al cargar el detalle del pedido');
    } finally {
      setLoadingDetails(false);
    }
  };

  const descargarPdfPedido = (pedidoId: number) => {
    const url = `/api/pedidos/${pedidoId}/pdf`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828'}}>
        <div className="text-white text-xl">Cargando tus pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
      
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Mis Pedidos</h1>

        {pedidos.length === 0 ? (
          <div className="rounded-lg shadow-md text-center" style={{ backgroundColor: '#1e2939'}}>
            <div className="rounded-lg p-10 text-center" style={{ backgroundColor: '#1e2939'}}>
            <p className="text-gray-300 text-lg">No tienes pedidos realizados</p>
          </div>
          </div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className='overflow-x-auto'>
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {pedidos.map(pedido => (
                      <tr key={pedido.id} className="hover:bg-gray-800/50">
                      <td className="p-3 text-white font-medium">#{pedido.id}</td>
                      <td className="p-3 text-gray-300">{new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
                      <td className="p-3 tetx-gray-300">${pedido.total}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${pedido.estado === 'entregado' ? 'bg-green-900/50 text-green-300' : 
                            pedido.estado === 'en_proceso' ? 'bg-blue-900/50 text-blue-300' : 
                            'bg-yellow-900/50 text-yellow-300'}`}>
                          {pedido.estado}
                        </span>
                      </td>
                      <td className="p-3 space-x-3">
                        <button
                          onClick={() => descargarPdfPedido(pedido.id)}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          Descargar PDF
                        </button>
                        <button
                          onClick={() => verDetallesPedido(pedido.id)}
                          className="text-primary hover:text-secondary"
                        >
                          Ver detalles
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

      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{backgroundColor: '#1e2939'}}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Detalle de pedido #{selectedPedido.id}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-200 text-2xl">×</button>
              </div>
              <div className="mb-4 space-y-1 text-gray-200">
                <p><strong>Fecha pedido:</strong> {new Date(selectedPedido.fecha_pedido).toLocaleDateString()}</p>
                <p><strong>Fecha entrega:</strong> {selectedPedido.fecha_entrega ? new Date(selectedPedido.fecha_entrega).toLocaleDateString() : 'No definida'}</p>
                <p><strong>Estado:</strong> {selectedPedido.estado}</p>
                <p><strong>Total:</strong> ${Number(selectedPedido.total).toFixed(2)}</p>
              </div>

              <h3 className="font-bold text-white mb-2">Productos</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="p-2 text-xs font-medium text-gray-300">Producto</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Medidas</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Cantidad</th>
                      <th className="p-2 text-xs font-medium text-gray-300">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {(selectedPedido.detalles || []).map((det, i) => (
                      <tr key={i} className="text-gray-200">
                        <td className="p-2">{det.producto_nombre || det.descripcion}</td>
                        <td className="p-2">{det.medida_largo && det.medida_ancho ? `${det.medida_largo}x${det.medida_ancho} cm` : 'No aplica'}</td>
                        <td className="p-2">{det.cantidad}</td>
                        <td className="p-2">${formatNumber(det.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <button
                  onClick={() => descargarPdfPedido(selectedPedido.id)}
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
    </div>
  );
}