'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Proyecto {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  imagen_url: string;
}

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/proyectos', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setProyectos(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (err.name !== 'AbortError') setProyectos([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 relative overflow-hidden">
      {/* Resplandor de fondo */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase bg-cyan-950/70 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3 shadow-inner">
            <span className="material-symbols-outlined text-sm">photo_library</span> Portafolio Completo
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Nuestros <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">Proyectos</span>
          </h1>
          <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
            Una muestra de trabajos realizados en cristalería de seguridad, fachadas flotantes, divisiones de baño y barandas arquitectónicas.
          </p>
        </div>

        {/* Skeleton de carga */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#131c2e] border border-gray-800 rounded-3xl overflow-hidden h-[420px] animate-pulse flex flex-col justify-between p-4"
              >
                <div className="h-60 bg-gray-800/80 rounded-2xl mb-4 w-full" />
                <div className="space-y-3 px-2">
                  <div className="h-5 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800/60 rounded w-full" />
                </div>
                <div className="h-8 bg-gray-800/40 rounded-xl w-1/3 mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Sin proyectos */}
        {!loading && proyectos.length === 0 && (
          <div className="text-center py-20 bg-[#131c2e] border border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
            <span className="material-symbols-outlined text-5xl text-gray-500 mb-3 block">photo_library</span>
            <h3 className="text-lg font-bold text-white mb-2">Próximamente publicaremos nuevos proyectos</h3>
            <p className="text-gray-400 text-sm mb-6">Estamos documentando nuestras últimas obras e instalaciones.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
            >
              <span>Volver al Inicio</span>
            </Link>
          </div>
        )}

        {/* Grid de proyectos */}
        {!loading && proyectos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {proyectos.map((proyecto) => (
              <Link
                key={proyecto.id}
                href={`/proyectos/${proyecto.slug}`}
                className="bg-[#131c2e]/90 hover:bg-[#162238] rounded-3xl overflow-hidden border border-gray-800 hover:border-cyan-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-950/40 group flex h-full flex-col justify-between"
              >
                <div>
                  <div className="h-64 overflow-hidden relative">
                    <Image
                      src={proyecto.imagen_url}
                      alt={proyecto.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#131c2e] via-transparent to-transparent opacity-85" />
                    <div className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md border border-white/10 text-cyan-300 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Obra Realizada
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                      {proyecto.titulo}
                    </h2>
                    <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                      {proyecto.resumen}
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2 border-t border-gray-800/60 flex items-center justify-between text-cyan-400 font-semibold text-xs sm:text-sm">
                  <span>Ver detalles de la obra</span>
                  <span className="material-symbols-outlined text-base group-hover:translate-x-1.5 transition-transform duration-200">
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
