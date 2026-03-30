'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url?: string;
  activo: boolean;
}

export default function AdminProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // 🗑 ELIMINAR / HABILITAR
  const eliminarProducto = async (id: number) => {
    const confirmar = confirm('¿Seguro que quieres eliminar este producto?');

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/admin/productos/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        fetchProductos();
        alert('Se eliminó exitosamente');
      } else {
        const errorData = await res.json();
        alert(`Error al eliminar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 🔄 HABILITAR
  const habilitarProducto = async (id: number) => {
    const confirmar = confirm('¿Seguro que quieres habilitar este producto?');

    if (!confirmar) return;

    try {
      const res = await fetch(`/api/admin/productos/${id}/habilitar`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (res.ok) {
        fetchProductos();
        alert('Producto habilitado exitosamente');
      } else {
        const errorData = await res.json();
        alert(`Error al habilitar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ✏️ EDITAR
  const editarProducto = async (producto: Producto) => {
    const nuevoNombre = prompt('Nuevo nombre:', producto.nombre);
    if (!nuevoNombre) return;

    const nuevaDescripcion = prompt('Nueva descripción:', producto.descripcion);
    if (!nuevaDescripcion) return;

    try {
      const res = await fetch(`/api/admin/productos/${producto.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nombre: nuevoNombre,
          descripcion: nuevaDescripcion
        })
      });

      if (res.ok) {
        fetchProductos();
        alert('Edición exitosa');
      } else {
        const errorData = await res.json();
        alert(`Error al editar: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Cargando Productos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#101828' }}>
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
          <Link 
            href="/admin"
            className="bg-primary hover:bg-secondary text-blue-400 px-4 py-2 rounded-md transition-colors">
            Volver
          </Link>
        </div>

        {error ? (
          <div className="rounded-xl bg-red-900/30 border border-red-500 p-6 text-red-200">
            {error}
          </div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-700'>
                  {productos.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-800/50 ${!p.activo ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {p.imagen_url && (
                            <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 rounded object-cover" />
                            )}
                            <span className="text-white font-medium">{p.nombre}</span>
                            {!p.activo && (
                              <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">Inactivo</span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{p.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-3">
                        <button
                          onClick={() => editarProducto(p)}
                          disabled={!p.activo}
                          className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disable:cursor-not-allowed"
                        >
                          Editar
                        </button>
                        {p.activo ? (
                          <button
                            onClick={() => eliminarProducto(p.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        ) : (
                          <button
                            onClick={() => habilitarProducto(p.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            Habilitar
                          </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}