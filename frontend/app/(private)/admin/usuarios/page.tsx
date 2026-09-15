'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: string;
  aprobado: boolean;
  ultimo_acceso?: string | null;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileActionUsuario, setMobileActionUsuario] = useState<Usuario | null>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      } else {
        console.error('Error en la respuesta:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchUsuarios(), 0);
  }, []);

  const aprobarUsuario = async (id: number) => {
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setUsuarios(usuarios.map(user =>
          user.id === id ? { ...user, aprobado: true } : user
        ));
      }
    } catch (error) {
      console.error('Error al aprobar usuario:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver al Panel
          </Link>
        </div>
        
        {usuarios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 text-lg">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Teléfono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Último acceso
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
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {usuario.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {usuario.telefono || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {usuario.rol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-ES') : 'Nunca'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.aprobado
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {usuario.aprobado ? 'Aprobado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="hidden md:block space-x-3">
                          {!usuario.aprobado && (
                            <button
                              onClick={() => aprobarUsuario(usuario.id)}
                              className="text-green-400 hover:text-green-300"
                            >
                              Aprobar
                            </button>
                          )}
                          <button className="text-red-400 hover:text-red-300">
                            Eliminar
                          </button>
                        </div>
                        <div className="md:hidden">
                          <button
                            onClick={() => setMobileActionUsuario(usuario)}
                            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-white transition-colors border border-gray-600"
                          >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            Acciones
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de acciones para móvil */}
      {mobileActionUsuario && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 md:hidden p-4">
          <div className="rounded-2xl shadow-xl w-full mx-auto" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Acciones de Usuario</h2>
                  <p className="text-gray-400 text-sm">{mobileActionUsuario.nombre}</p>
                </div>
                <button
                  onClick={() => setMobileActionUsuario(null)}
                  className="text-gray-400 hover:text-gray-200 text-3xl min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {!mobileActionUsuario.aprobado && (
                  <button
                    onClick={() => {
                      aprobarUsuario(mobileActionUsuario.id);
                      setMobileActionUsuario(null);
                    }}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 text-green-400 bg-green-900/30 hover:bg-green-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-green-800/50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Aprobar Usuario
                  </button>
                )}
                
                <button
                  onClick={() => {
                    // Logic to delete is empty in original file
                    setMobileActionUsuario(null);
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 text-red-400 bg-red-900/30 hover:bg-red-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-red-800/50"
                >
                  <span className="material-symbols-outlined">delete</span>
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}