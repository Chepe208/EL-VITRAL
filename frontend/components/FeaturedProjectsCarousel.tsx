'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';

interface ProyectoDestacado {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  imagen_url: string;
}

export default function FeaturedProjectsCarousel() {
  const [proyectos, setProyectos] = useState<ProyectoDestacado[]>([]);

  useEffect(() => {
    fetch('/api/proyectos')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setProyectos(Array.isArray(data) ? data : []))
      .catch(() => setProyectos([]));
  }, []);

  return (
    <section className="py-20 bg-[#0d131f]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase block mb-2">Portafolio</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">Proyectos destacados</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Descubre nuestros últimos trabajos en cristalería e instalaciones a medida.</p>
        </div>

        {proyectos.length > 0 ? (
          <Swiper
            modules={[Autoplay, Pagination]}
            spaceBetween={32}
            slidesPerView={1}
            breakpoints={{ 768: { slidesPerView: 2 }, 1280: { slidesPerView: 3 } }}
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {proyectos.map((proyecto) => (
              <SwiperSlide key={proyecto.id} className="h-auto">
                <Link
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
                      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{proyecto.titulo}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">{proyecto.resumen}</p>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2 flex items-center text-cyan-400 font-semibold text-xs group-hover:translate-x-1 transition-transform">
                    <span>Ver detalles</span><span className="ml-1 text-sm">→</span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <p className="text-center text-gray-400">Próximamente publicaremos nuevos proyectos.</p>
        )}
      </div>
    </section>
  );
}
