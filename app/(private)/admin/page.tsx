'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function AdminPage() {
  const [stats, setStats] = useState({
    usuarios: 0,
    productos: 0,
    cotizaciones: 0,
    pedidos: 0
  });
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/usuarios', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/productos', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/cotizaciones', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/pedidos', { credentials: 'include' }).then(res => res.ok ? res.json() : []),
    ]).then(([usuarios, productos, cotizaciones, pedidos]) => {
      setStats({
        usuarios: usuarios.length || 0,
        productos: productos.length || 0,
        cotizaciones: cotizaciones.length || 0,
        pedidos: pedidos.length || 0
      });
    }).catch(() => {
      router.push('/');
    });
  }, [router]);

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: '#101828'}}>
      <NavBar />
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Panel de Administración</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
            <h3 className="text-lg text-gray-300 mb-2">Usuarios</h3>
            <p className="text-3xl font-bold text-primary">{stats.usuarios}</p>
          </div>
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
            <h3 className="text-lg text-gray-300 mb-2">Productos</h3>
            <p className="text-3xl font-bold text-primary">{stats.productos}</p>
          </div>
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
            <h3 className="text-lg text-gray-300 mb-2">Cotizaciones</h3>
            <p className="text-3xl font-bold text-primary">{stats.cotizaciones}</p>
          </div>
          <div className="p-6 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
            <h3 className="text-lg text-gray-300 mb-2">Pedidos</h3>
            <p className="text-3xl font-bold text-primary">{stats.pedidos}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Link href="/admin/usuarios" className="p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" style={{ backgroundColor: '#1e2939'}}>
            <h2 className="text-xl font-bold text-blue-300 mb-2">Gestionar Usuarios</h2>
            <p className="text-gray-300">Ver, aprobar y administrar usuarios</p>
          </Link>
          <Link href="/admin/productos" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" style={{ backgroundColor: '#1e2939'}}>
            <h2 className="text-xl font-bold text-blue-300 mb-2">Gestionar Productos</h2>
            <p className="text-gray-300">Crear, editar y desactivar productos</p>
          </Link>
          <Link href="/admin/cotizaciones" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" style={{ backgroundColor: '#1e2939'}}>
            <h2 className="text-xl font-bold text-blue-300 mb-2">Ver Cotizaciones</h2>
            <p className="text-gray-300">Listado completo de cotizaciones</p>
          </Link>
          <Link href="/admin/pedidos" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow" style={{ backgroundColor: '#1e2939'}}>
            <h2 className="text-xl font-bold text-blue-300 mb-2">Gestionar Pedidos</h2>
            <p className="text-gray-300">Ver y actualizar estado de pedidos</p>
          </Link>
        </div>
      </div>
    </div>
  );
}