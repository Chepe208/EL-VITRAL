'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MovimientoInventario {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  tipo_movimiento: string;
  descripcion?: string;
  pedido_id?: number;
  usuario_nombre: string;
  fecha_movimiento: string;
}

interface ProductoCombo {
  id: number;
  nombre: string;
  stock: number;
}

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [productos, setProductos] = useState<ProductoCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<number | ''>('');
  const [cantidad, setCantidad] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [movimientosRes, productosRes] = await Promise.all([
        fetch('/api/admin/inventario', { credentials: 'include' }),
        fetch('/api/admin/productos', { credentials: 'include' }),
      ]);

      if (!movimientosRes.ok || !productosRes.ok) {
        setError('No se pudo cargar el historial o los productos.');
        return;
      }

      const [movimientosData, productosData] = await Promise.all([
        movimientosRes.json(),
        productosRes.json(),
      ]);

      setMovimientos(movimientosData);
      setProductos(productosData);
    } catch (err) {
      console.error(err);
      setError('Error al cargar inventario.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedProduct || cantidad <= 0) {
      setError('Selecciona producto y cantidad válida.');
      return;
    }

    try {
      const res = await fetch('/api/admin/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          producto_id: selectedProduct,
          cantidad,
          descripcion,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Error al registrar movimiento.');
        return;
      }

      setSuccess('Entrada registrada correctamente.');
      setSelectedProduct('');
      setCantidad(0);
      setDescripcion('');
      loadData();
    } catch (error) {
      console.error(error);
      setError('Error al enviar el movimiento.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Historial de Inventario</h1>
            <p className="text-gray-400">Entradas y salidas vinculadas a productos existentes.</p>
          </div>
          <Link
            href="/admin"
            className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors"
          >
            Volver
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 mb-8">
          <div>
            <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{new Date(movimiento.fecha_movimiento).toLocaleString()}</td>
                        <td className="px-6 py-4 text-white whitespace-nowrap">{movimiento.producto_nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${movimiento.tipo_movimiento === 'entrada' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                            {movimiento.tipo_movimiento}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{movimiento.cantidad}</td>
                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{movimiento.usuario_nombre}</td>
                        <td className="px-6 py-4 text-gray-300">{movimiento.descripcion || 'Sin descripción'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1e2939' }}>
            <h2 className="text-xl font-bold text-white mb-4">Registrar Entrada</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(event) => setSelectedProduct(Number(event.target.value) || '')}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white px-3 py-2"
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} (Stock: {producto.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Cantidad</label>
                <input
                  type="number"
                  value={cantidad}
                  min={1}
                  onChange={(event) => setCantidad(Number(event.target.value))}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-gray-900 text-white px-3 py-2"
                  rows={3}
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-400">{success}</p>}

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 text-white rounded-md px-4 py-2 transition-colors"
              >
                Registrar entrada
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
