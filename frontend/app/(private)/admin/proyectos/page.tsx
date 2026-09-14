'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Proyecto {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  descripcion: string | null;
  imagen_url: string;
  tecnologias: string | null;
  orden: number;
  activo: boolean | number;
}

const emptyForm = {
  titulo: '', slug: '', resumen: '', descripcion: '', imagen_url: '', tecnologias: '', orden: 0, activo: true,
};

export default function AdminProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [currentProject, setCurrentProject] = useState<Proyecto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/proyectos', { credentials: 'include' });
      if (!response.ok) throw new Error('No fue posible cargar los proyectos');
      const data = await response.json();
      setProyectos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los proyectos destacados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/proyectos', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('No fue posible cargar los proyectos');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProyectos(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los proyectos destacados.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openNewProject = () => {
    setCurrentProject(null);
    setForm({ ...emptyForm, orden: proyectos.length + 1 });
    setShowEditor(true);
  };

  const openEditor = (project: Proyecto) => {
    setCurrentProject(project);
    setForm({
      titulo: project.titulo,
      slug: project.slug,
      resumen: project.resumen,
      descripcion: project.descripcion || '',
      imagen_url: project.imagen_url,
      tecnologias: project.tecnologias || '',
      orden: Number(project.orden),
      activo: Boolean(project.activo),
    });
    setShowEditor(true);
  };

  const saveProject = async () => {
    if (!form.titulo.trim() || !form.resumen.trim() || !form.imagen_url.trim()) {
      setMensaje({ tipo: 'error', texto: 'Completa el título, el resumen y la URL de la imagen.' });
      return;
    }

    const editing = Boolean(currentProject);
    try {
      const response = await fetch(
        editing ? `/api/admin/proyectos/${currentProject?.id}` : '/api/admin/proyectos',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(form),
        },
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMensaje({ tipo: 'error', texto: data.error || 'No se pudo guardar el proyecto.' });
        return;
      }
      setShowEditor(false);
      await fetchProjects();
      setMensaje({ tipo: 'ok', texto: editing ? 'Proyecto actualizado correctamente.' : 'Proyecto creado correctamente.' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar el proyecto.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#101828]">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Proyectos destacados</h1>
            <p className="mt-2 text-gray-400">Administra los proyectos que se muestran en el carrusel de la página principal.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openNewProject} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-500">Nuevo proyecto</button>
            <Link href="/admin" className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:bg-gray-600">← Volver al panel</Link>
          </div>
        </div>

        {mensaje && (
          <div className={`mb-6 rounded-xl border p-4 text-sm ${mensaje.tipo === 'ok' ? 'border-green-600 bg-green-900/30 text-green-200' : 'border-red-500 bg-red-900/30 text-red-200'}`}>
            {mensaje.texto}
          </div>
        )}

        {loading ? <p className="text-white">Cargando proyectos...</p> : error ? (
          <div className="rounded-xl border border-red-500 bg-red-900/30 p-5 text-red-200">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-700 bg-[#1e2939] shadow-md">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-800 text-left text-xs uppercase tracking-wider text-gray-300">
                <tr><th className="px-5 py-4">Proyecto</th><th className="px-5 py-4">Resumen</th><th className="px-5 py-4">Orden</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Acción</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {proyectos.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-800/40">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><Image src={project.imagen_url} alt="" width={64} height={48} className="h-12 w-16 rounded object-cover" /><div><p className="font-medium text-white">{project.titulo}</p><p className="text-xs text-gray-400">/{project.slug}</p></div></div></td>
                    <td className="max-w-sm px-5 py-4 text-sm text-gray-300">{project.resumen}</td>
                    <td className="px-5 py-4 text-white">{project.orden}</td>
                    <td className="px-5 py-4"><span className={Boolean(project.activo) ? 'text-green-400' : 'text-gray-400'}>{Boolean(project.activo) ? 'Visible' : 'Oculto'}</span></td>
                    <td className="px-5 py-4"><button onClick={() => openEditor(project)} className="text-blue-400 hover:text-blue-300">Editar</button></td>
                  </tr>
                ))}
                {proyectos.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400">Aún no hay proyectos registrados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5"><div><h2 className="text-2xl font-semibold text-white">{currentProject ? 'Editar proyecto' : 'Nuevo proyecto'}</h2><p className="text-sm text-slate-400">Esta información será la que se verá en la landing y en el detalle.</p></div><button onClick={() => setShowEditor(false)} className="text-2xl text-slate-400 hover:text-white">×</button></div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <Field label="Título *" value={form.titulo} onChange={(titulo) => setForm({ ...form, titulo })} />
              <Field label="Enlace (slug)" value={form.slug} placeholder="Se genera desde el título si se deja vacío" onChange={(slug) => setForm({ ...form, slug })} />
              <div className="sm:col-span-2"><Field label="Resumen para la tarjeta *" value={form.resumen} onChange={(resumen) => setForm({ ...form, resumen })} /></div>
              <div className="sm:col-span-2"><Area label="Descripción completa" value={form.descripcion} onChange={(descripcion) => setForm({ ...form, descripcion })} /></div>
              <div className="sm:col-span-2"><Field label="URL de imagen *" value={form.imagen_url} onChange={(imagen_url) => setForm({ ...form, imagen_url })} /></div>
              <div className="sm:col-span-2"><Field label="Materiales o tecnologías (separados por coma)" value={form.tecnologias} onChange={(tecnologias) => setForm({ ...form, tecnologias })} /></div>
              <div><label className="block text-sm font-medium text-slate-300">Orden en el carrusel</label><input type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white" /></div>
              <label className="mt-8 flex items-center gap-3 text-sm text-slate-300"><input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="h-5 w-5" />Mostrar este proyecto en la landing</label>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-5"><button onClick={() => setShowEditor(false)} className="rounded-xl border border-slate-700 px-5 py-3 text-slate-200">Cancelar</button><button onClick={saveProject} className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-500">{currentProject ? 'Guardar cambios' : 'Crear proyecto'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder:text-slate-600" /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-medium text-slate-300">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white" /></label>;
}
