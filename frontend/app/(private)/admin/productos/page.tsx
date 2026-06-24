'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url?: string;
  tipo: string;
  unidad_medida: string;
  precio_base: number;
  stock: number;
  activo: boolean;
}

const tipos = ['vidrio', 'espejo', 'aluminio', 'herraje', 'insumo'];

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Producto | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'vidrio',
    unidad_medida: '',
    precio_base: 0,
    imagen_url: '',
    stock: 0,
    activo: true,
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const res = await fetch('/api/admin/productos', { credentials: 'include' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.error || `${res.status} ${res.statusText}`;
        setError(`No autorizado: ${message}`);
        setProductos([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Datos de productos inválidos');
        setProductos([]);
        return;
      }

      setProductos(data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (producto: Producto) => {
    setCurrentProduct(producto);
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      tipo: producto.tipo,
      unidad_medida: producto.unidad_medida,
      precio_base: producto.precio_base,
      imagen_url: producto.imagen_url || '',
      stock: producto.stock,
      activo: producto.activo,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentProduct(null);
  };

  const saveProduct = async () => {
    const isEditing = Boolean(currentProduct);

    try {
      const url = isEditing ? `/api/admin/productos/${currentProduct?.id}` : '/api/admin/productos';
      const method = isEditing ? 'PATCH' : 'POST';
      const body = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        tipo: form.tipo,
        unidad_medida: form.unidad_medida,
        precio_base: form.precio_base,
        imagen_url: form.imagen_url,
        stock: form.stock,
        activo: form.activo,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || (isEditing ? 'Error al actualizar el producto' : 'Error al crear el producto'));
        return;
      }

      fetchProductos();
      closeModal();
      alert(isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
    } catch (err) {
      console.error(err);
      alert(isEditing ? 'Error al guardar el producto' : 'Error al crear el producto');
    }
  };

  const deleteProduct = async () => {
    if (!currentProduct) return;

    const confirmar = confirm('¿Quieres eliminar este producto?');
    if (!confirmar) return;

    try {
      const res = await fetch(`/api/admin/productos/${currentProduct.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || 'Error al eliminar el producto');
        return;
      }

      fetchProductos();
      closeModal();
      alert('Producto eliminado correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el producto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Cargando Productos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCurrentProduct(null);
                setForm({
                  nombre: '',
                  descripcion: '',
                  tipo: 'vidrio',
                  unidad_medida: '',
                  precio_base: 0,
                  imagen_url: '',
                  stock: 0,
                  activo: true,
                });
                setShowModal(true);
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md transition-colors"
            >
              Nuevo Producto
            </button>
            <Link
              href="/admin"
              className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors"
            >
              Volver
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-900/30 border border-red-500 p-6 text-red-200">
            {error}
          </div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {productos.map((producto) => (
                    <tr key={producto.id} className={`hover:bg-gray-800/50 ${!producto.activo ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {producto.imagen_url && (
                            <img src={producto.imagen_url} alt={producto.nombre} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-white font-medium">{producto.nombre}</p>
                            <p className="text-gray-400 text-sm">{producto.tipo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{producto.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{producto.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openEditor(producto)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Editar
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

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-950">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-semibold text-white">{currentProduct ? 'Detalle de producto' : 'Nuevo producto'}</h2>
                <p className="text-sm text-slate-400">
                  {currentProduct ? 'Edita la información del producto y gestiona su estado.' : 'Completa los datos para crear un nuevo producto.'}
                </p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="px-6 py-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                >
                  {tipos.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Unidad de medida</label>
                <input
                  value={form.unidad_medida}
                  onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Precio base</label>
                <input
                  type="number"
                  value={form.precio_base}
                  onChange={(e) => setForm({ ...form, precio_base: Number(e.target.value) })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300">Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  readOnly={Boolean(currentProduct)}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className={`mt-2 w-full rounded-2xl border border-slate-700 px-4 py-3 ${currentProduct ? 'bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white'}`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300">URL de imagen</label>
                <input
                  value={form.imagen_url}
                  onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3">
                <input
                  id="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-primary"
                />
                <label htmlFor="activo" className="text-sm text-slate-300">Producto activo</label>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-800 px-6 py-5 sm:flex-row sm:justify-between">
              <button
                onClick={deleteProduct}
                className="w-full rounded-2xl bg-red-600 px-5 py-3 text-white hover:bg-red-500 transition-colors sm:w-auto"
              >
                Eliminar
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={closeModal}
                  className="w-full rounded-2xl border border-slate-700 px-5 py-3 text-slate-200 hover:border-slate-500 sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveProduct}
                  className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-500 transition-colors sm:w-auto"
                >
                  {currentProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
