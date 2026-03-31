'use client';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: string;
  aprobado: boolean;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

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
        // Actualizar el estado local
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
        <NavBar />
        <div className="flex items-center justify-center py-12">
          <div className="text-white text-xl">Cargando usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Gestión de Usuarios</h1>

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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.aprobado
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {usuario.aprobado ? 'Aprobado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {!usuario.aprobado && (
                          <button
                            onClick={() => aprobarUsuario(usuario.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            Aprobar
                          </button>
                        )}
                        <button className="text-blue-400 hover:text-blue-300">
                          Editar
                        </button>
                        <button className="text-red-400 hover:text-red-300">
                          Eliminar
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
    </div>
  );
}