'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'usuario' | 'admin';
  aprobado: boolean;
  activo: boolean;
  ultimo_acceso?: string | null;
}

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmRole, setConfirmRole] = useState<{ usuario: Usuario; rol: 'usuario' | 'admin' } | null>(null);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch('/api/admin/usuarios', { credentials: 'include' });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios');
      setUsuarios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchUsuarios, 0);
    return () => clearTimeout(timer);
  }, []);

  const updateUser = async (id: string, changes: Partial<Pick<Usuario, 'aprobado' | 'activo' | 'rol'>>) => {
    setError('');
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, ...changes }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar el usuario');
      setUsuarios(prev => prev.map(user => user.id === id ? { ...user, ...changes } : user));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el usuario');
    }
  };

  const changeRole = (usuario: Usuario, rol: 'usuario' | 'admin') => {
    if (rol !== usuario.rol) setConfirmRole({ usuario, rol });
  };

  if (loading) {
    return <div className="min-h-screen bg-[#101828] flex items-center justify-center text-white text-xl">Cargando usuarios...</div>;
  }

  return (
    <div className="min-h-screen bg-[#101828]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
          <Link href="/admin" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">← Volver al Panel</Link>
        </div>
        {error && <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}
        {usuarios.length === 0 ? <p className="text-center py-12 text-gray-300 text-lg">No hay usuarios registrados</p> : (
          <div className="rounded-lg shadow-md overflow-x-auto bg-[#1e2939]">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-800"><tr>
                {['Nombre', 'Email', 'Teléfono', 'Rol', 'Último acceso', 'Estado', 'Acciones'].map(title => <th key={title} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">{title}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-gray-700">
                {usuarios.map(usuario => (
                  <tr key={usuario.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm font-medium text-white">{usuario.nombre}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{usuario.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{usuario.telefono || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <select value={usuario.rol} onChange={e => changeRole(usuario, e.target.value as 'usuario' | 'admin')} className="rounded bg-gray-800 border border-gray-600 px-2 py-1 text-white">
                        <option value="usuario">Usuario</option><option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString('es-CO') : 'Nunca'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit rounded-full px-2 py-1 text-xs ${usuario.activo ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{usuario.activo ? 'Activo' : 'Desactivado'}</span>
                        <span className={`w-fit rounded-full px-2 py-1 text-xs ${usuario.aprobado ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>{usuario.aprobado ? 'Aprobado' : 'Pendiente'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-3">
                      <button onClick={() => updateUser(usuario.id, { aprobado: !usuario.aprobado })} className="text-cyan-400 hover:text-cyan-300">{usuario.aprobado ? 'Desaprobar' : 'Aprobar'}</button>
                      <button onClick={() => updateUser(usuario.id, { activo: !usuario.activo })} className={usuario.activo ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}>{usuario.activo ? 'Eliminar' : 'Reactivar'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-[#1e2939] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">¿Estás seguro de este cambio?</h2>
            <p className="mt-3 text-sm text-gray-300">El usuario <strong>{confirmRole.usuario.nombre}</strong> pasará a tener el rol de <strong>{confirmRole.rol === 'admin' ? 'administrador' : 'usuario'}</strong>.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmRole(null)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">Cancelar</button>
              <button onClick={() => { updateUser(confirmRole.usuario.id, { rol: confirmRole.rol }); setConfirmRole(null); }} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">Sí, cambiar rol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
