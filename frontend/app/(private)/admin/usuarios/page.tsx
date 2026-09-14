'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: 'usuario' | 'admin';
  aprobado: boolean | number;
  activo: boolean | number;
  ultimo_acceso?: string | null;
}

const isTrue = (value: boolean | number) => value === true || value === 1;

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [cambioDeRolPendiente, setCambioDeRolPendiente] = useState<{
    usuario: Usuario;
    nuevoRol: Usuario['rol'];
  } | null>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
      setUsuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsuarios();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const actualizarUsuario = async (usuario: Usuario, cambios: Partial<Pick<Usuario, 'aprobado' | 'activo' | 'rol'>>) => {
    setSavingId(usuario.id);
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: usuario.id, ...cambios }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el usuario');
      setUsuarios((actuales) => actuales.map((item) => item.id === usuario.id ? data.usuario : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    } finally {
      setSavingId(null);
    }
  };

  const confirmarCambioDeRol = (usuario: Usuario, nuevoRol: Usuario['rol']) => {
    if (nuevoRol === usuario.rol) return;
    setCambioDeRolPendiente({ usuario, nuevoRol });
  };

  const ejecutarCambioDeRol = async () => {
    if (!cambioDeRolPendiente) return;
    const { usuario, nuevoRol } = cambioDeRolPendiente;
    setCambioDeRolPendiente(null);
    await actualizarUsuario(usuario, { rol: nuevoRol });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#101828] flex items-center justify-center text-white text-xl">Cargando usuarios...</div>;
  }

  return (
    <div className="min-h-screen bg-[#101828]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <Link href="/admin" className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">← Volver al Panel</Link>
        </div>

        {error && <div className="mb-6 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-300">{error}</div>}

        {usuarios.length === 0 ? (
          <div className="text-center py-12 text-gray-300 text-lg">No hay usuarios registrados</div>
        ) : (
          <div className="rounded-lg shadow-md overflow-hidden bg-[#1e2939]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    {['Nombre', 'Email', 'Teléfono', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map((titulo) => (
                      <th key={titulo} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">{titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {usuarios.map((usuario) => {
                    const aprobado = isTrue(usuario.aprobado);
                    const activo = isTrue(usuario.activo);
                    const saving = savingId === usuario.id;
                    return (
                      <tr key={usuario.id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{usuario.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{usuario.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{usuario.telefono || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select value={usuario.rol} disabled={saving} onChange={(e) => confirmarCambioDeRol(usuario, e.target.value as Usuario['rol'])} className="rounded bg-gray-900 border border-gray-700 px-2 py-1 text-sm text-white">
                            <option value="usuario">Usuario</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-CO') : 'Nunca'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`mr-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activo ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{activo ? 'Activo' : 'Desactivado'}</span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${aprobado ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>{aprobado ? 'Aprobado' : 'Pendiente'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                          <button disabled={saving} onClick={() => actualizarUsuario(usuario, { aprobado: !aprobado })} className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50">{aprobado ? 'Desaprobar' : 'Aprobar'}</button>
                          <button disabled={saving} onClick={() => actualizarUsuario(usuario, { activo: !activo })} className={`${activo ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'} disabled:opacity-50`}>{activo ? 'Desactivar' : 'Activar'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {cambioDeRolPendiente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" role="presentation">
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#1e2939] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-cambio-rol-titulo"
          >
            <h2 id="confirmar-cambio-rol-titulo" className="text-xl font-bold text-white">
              Confirmar cambio de rol
            </h2>
            <p className="mt-3 text-gray-300">
              ¿Estás seguro de cambiar el rol de <strong className="text-white">{cambioDeRolPendiente.usuario.nombre}</strong> a{' '}
              <strong className="text-white">
                {cambioDeRolPendiente.nuevoRol === 'admin' ? 'administrador' : 'usuario'}
              </strong>?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCambioDeRolPendiente(null)}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarCambioDeRol}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Sí, cambiar rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
