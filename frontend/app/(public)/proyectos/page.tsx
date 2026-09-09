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
    fetch('/api/proyectos')
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => setProyectos(Array.isArray(data) ? data : []))
      .catch(() => setProyectos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d131f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase block mb-2">
            Portafolio
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Nuestros proyectos
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Trabajos de cristalería e instalaciones a medida.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gray-400">Cargando proyectos...</p>
        ) : proyectos.length === 0 ? (
          <p className="text-center text-gray-400">Próximamente publicaremos nuevos proyectos.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {proyectos.map((proyecto) => (
              <Link
                key={proyecto.id}
                href={`/proyectos/${proyecto.slug}`}
                className="bg-[#161f30] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-xl group flex h-full flex-col justify-between"
              >
                <div>
                  <div className="h-60 overflow-hidden relative">
                    <Image
                      src={proyecto.imagen_url}
                      alt={proyecto.titulo}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161f30] via-transparent to-transparent opacity-80" />
                  </div>
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {proyecto.titulo}
                    </h2>
                    <p className="text-gray-400 text-xs leading-relaxed">{proyecto.resumen}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-2 flex items-center text-cyan-400 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                  <span>Ver detalles</span>
                  <span className="ml-1 text-sm">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
