'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

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

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetch('/api/pedidos')
      .then(res => res.json())
      .then(data => {
        setPedidos(data);
        setLoading(false);
      });
  }, []);

  const verDetallesPedido = async (pedidoId: number) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`);
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

  if (loading) {
    return (
      
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Mis Pedidos</h1>

        {pedidos.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">No tienes pedidos aún.</p>
            <Link href="/catalogo" className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-secondary">
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">ID</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">#{pedido.id}</td>
                    <td className="p-3">{new Date(pedido.fecha_pedido).toLocaleDateString()}</td>
                    <td className="p-3">${pedido.total}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' : 
                          pedido.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="p-3">
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
        )}
      </div>

      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detalle de pedido #{selectedPedido.id}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <div className="mb-4">
                <p><strong>Fecha pedido:</strong> {new Date(selectedPedido.fecha_pedido).toLocaleDateString()}</p>
                <p><strong>Fecha entrega:</strong> {selectedPedido.fecha_entrega ? new Date(selectedPedido.fecha_entrega).toLocaleDateString() : 'No definida'}</p>
                <p><strong>Estado:</strong> {selectedPedido.estado}</p>
                <p><strong>Total:</strong> ${Number(selectedPedido.total).toFixed(2)}</p>
              </div>

              <h3 className="font-bold mb-2">Productos</h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-xs">Producto</th>
                      <th className="p-2 text-xs">Medidas</th>
                      <th className="p-2 text-xs">Cantidad</th>
                      <th className="p-2 text-xs">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedPedido.detalles || []).map((det, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{det.producto_nombre || det.descripcion}</td>
                        <td className="p-2">{det.medida_largo && det.medida_ancho ? `${det.medida_largo}x${det.medida_ancho} cm` : 'No aplica'}</td>
                        <td className="p-2">{det.cantidad}</td>
                        <td className="p-2">${Number(det.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}