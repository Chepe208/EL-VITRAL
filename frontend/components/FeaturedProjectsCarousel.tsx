'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';

interface ProyectoDestacado {
  id: number;
  titulo: string;
  slug: string;
  resumen: string;
  imagen_url: string;
  tecnologias?: string;
}

export default function FeaturedProjectsCarousel() {
  const [proyectos, setProyectos] = useState<ProyectoDestacado[]>([]);
  const [loading, setLoading] = useState(true);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

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
    <section className="py-20 sm:py-24 bg-[#0d131f] relative overflow-hidden border-b border-gray-800/80">
      {/* Resplandor ambiental */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Cabecera de la sección con Controles */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase bg-cyan-950/60 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3 shadow-inner">
              <span className="material-symbols-outlined text-sm">photo_library</span> Portafolio de Obras
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Proyectos <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">destacados</span>
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base leading-relaxed">
              Explora nuestras instalaciones a medida en cristalería de seguridad, divisiones y estructuras arquitectónicas de alta gama.
            </p>
          </div>

          {/* Controles de Navegación del Carrusel */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/proyectos"
              className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mr-2 group"
            >
              <span>Ver todos</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
            </Link>

            <button
              type="button"
              onClick={() => swiperInstance?.slidePrev()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-900/80 hover:bg-cyan-950/80 border border-gray-700/80 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              aria-label="Proyecto anterior"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <button
              type="button"
              onClick={() => swiperInstance?.slideNext()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-900/80 hover:bg-cyan-950/80 border border-gray-700/80 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-400 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              aria-label="Proyecto siguiente"
            >
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Estado: Cargando Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#131c2e] border border-gray-800/80 rounded-2xl sm:rounded-3xl overflow-hidden h-[420px] animate-pulse flex flex-col justify-between p-4"
              >
                <div className="h-56 bg-gray-800/60 rounded-xl mb-4 w-full" />
                <div className="space-y-3 px-2">
                  <div className="h-5 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800/60 rounded w-full" />
                  <div className="h-4 bg-gray-800/60 rounded w-2/3" />
                </div>
                <div className="h-8 bg-gray-800/40 rounded-lg w-1/3 mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Estado: Lista de Proyectos */}
        {!loading && proyectos.length > 0 && (
          <Swiper
            onSwiper={setSwiperInstance}
            modules={[Autoplay, Pagination]}
            spaceBetween={28}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 1.5, spaceBetween: 24 },
              768: { slidesPerView: 2, spaceBetween: 28 },
              1024: { slidesPerView: 3, spaceBetween: 32 },
            }}
            autoplay={{ delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            className="!pb-14"
          >
            {proyectos.map((proyecto) => (
              <SwiperSlide key={proyecto.id} className="!h-auto">
                <Link
                  href={`/proyectos/${proyecto.slug}`}
                  className="bg-[#131b2e]/90 hover:bg-[#162238] border border-gray-800 hover:border-cyan-500/40 rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-cyan-950/40 group flex h-full flex-col justify-between"
                >
                  <div>
                    {/* Contenedor de Imagen */}
                    <div className="h-60 sm:h-64 overflow-hidden relative">
                      <Image
                        src={proyecto.imagen_url}
                        alt={proyecto.titulo}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#131b2e] via-transparent to-transparent opacity-90" />

                      {/* Badge flotante en la foto */}
                      <div className="absolute top-3.5 left-3.5 bg-black/65 backdrop-blur-md border border-white/10 text-cyan-300 text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Obra Realizada
                      </div>
                    </div>

                    {/* Contenido del Proyecto */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {proyecto.titulo}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                        {proyecto.resumen}
                      </p>
                    </div>
                  </div>

                  {/* Pie de Tarjeta */}
                  <div className="px-6 pb-6 pt-2 border-t border-gray-800/60 flex items-center justify-between text-cyan-400 font-semibold text-xs sm:text-sm">
                    <span>Ver detalles del proyecto</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1.5 transition-transform duration-200">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Estado: Sin Proyectos */}
        {!loading && proyectos.length === 0 && (
          <div className="text-center py-16 bg-[#131b2e] border border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
            <span className="material-symbols-outlined text-5xl text-gray-500 mb-3 block">photo_library</span>
            <h3 className="text-lg font-bold text-white mb-1">Próximamente publicaremos nuevos proyectos</h3>
            <p className="text-gray-400 text-xs sm:text-sm">Estamos preparando la documentación de nuestras instalaciones más recientes.</p>
          </div>
        )}

        {/* Botón CTA inferior */}
        <div className="text-center mt-4">
          <Link
            href="/proyectos"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white border border-gray-700 text-sm font-semibold transition-all hover:border-cyan-500/40"
          >
            <span className="material-symbols-outlined text-lg text-cyan-400">explore</span>
            <span>Explorar Portafolio Completo</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
