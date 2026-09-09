'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Proyecto {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  descripcion: string | null;
  imagen_url: string;
  tecnologias: string | null;
}

export default function ProyectoDetalle() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [status, setStatus] = useState<'loading' | 'not-found' | 'error' | 'ready'>('loading');

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function loadProject() {
      try {
        setStatus('loading');
        const response = await fetch(`/api/proyectos/${encodeURIComponent(slug)}`, {
          signal: controller.signal,
        });

        if (response.status === 404) {
          setStatus('not-found');
          return;
        }
        if (!response.ok) throw new Error('No fue posible cargar el proyecto');

        setProyecto(await response.json());
        setStatus('ready');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setStatus('error');
      }
    }

    loadProject();
    return () => controller.abort();
  }, [slug]);

  if (status === 'loading') return <StatusMessage message="Cargando proyecto..." />;
  if (status === 'not-found') return <StatusMessage message="No encontramos el proyecto solicitado." />;
  if (status === 'error' || !proyecto) return <StatusMessage message="No fue posible cargar este proyecto. Inténtalo nuevamente." />;

  const tecnologias = (proyecto.tecnologias || '')
    .split(',')
    .map((tecnologia) => tecnologia.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#101828] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-[#1e2939] shadow-md">
          <div className="p-5 sm:p-8 md:p-12">
            <Link href="/" className="mb-5 inline-flex items-center text-sm text-gray-400 transition-colors hover:text-white sm:mb-6">
              <span className="material-symbols-outlined mr-1 text-base">arrow_back</span>
              Volver al inicio
            </Link>

            <h1 className="mb-5 text-2xl font-bold text-white sm:mb-6 sm:text-3xl md:text-4xl">{proyecto.titulo}</h1>
            <div className="relative mb-6 h-56 overflow-hidden rounded-xl shadow-lg sm:mb-8 sm:h-80 md:h-[500px]">
              <Image src={proyecto.imagen_url} alt={proyecto.titulo} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl">Sobre el proyecto</h2>
                <p className="mb-5 text-sm leading-relaxed text-gray-200 sm:mb-6 sm:text-base">{proyecto.descripcion || proyecto.resumen}</p>

                {tecnologias.length > 0 && (
                  <>
                    <h3 className="mb-3 text-lg font-bold text-white sm:text-xl">Materiales y tecnologías utilizadas</h3>
                    <ul className="mb-6 list-inside list-disc space-y-1 text-sm text-gray-200 sm:text-base">
                      {tecnologias.map((tecnologia) => <li key={tecnologia}>{tecnologia}</li>)}
                    </ul>
                  </>
                )}
              </div>

              <div className="self-start rounded-xl bg-gray-800/60 p-5 shadow-md sm:p-6">
                <h3 className="mb-3 text-base font-bold text-white sm:text-lg">¿Interesado en un proyecto similar?</h3>
                <p className="mb-4 text-sm text-gray-300">Contáctanos para recibir asesoría personalizada y una cotización sin compromiso.</p>
                <Link href="/cotizar" className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-500">
                  Solicitar cotización
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#101828] px-4">
      <div className="rounded-xl bg-[#1e2939] px-6 py-5 text-center text-gray-200 shadow-lg">
        <p>{message}</p>
        <Link href="/" className="mt-4 inline-block text-cyan-400 hover:text-cyan-300">Volver al inicio</Link>
      </div>
    </div>
  );
}
