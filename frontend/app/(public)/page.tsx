'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const FeaturedProjectsCarousel = dynamic(() => import('@/components/FeaturedProjectsCarousel'), {
  loading: () => <div className="py-20 bg-[#0d131f] flex items-center justify-center text-gray-400 text-sm min-h-[200px]">Cargando proyectos...</div>,
  ssr: false,
});

const ReviewsCarousel = dynamic(() => import('@/components/ReviewsCarousel'), {
  loading: () => <div className="py-20 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">Cargando reseñas...</div>,
  ssr: false,
});

const LocationSection = dynamic(() => import('@/components/LocationSection'), {
  loading: () => <div className="py-20 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 text-sm min-h-[200px]">Cargando ubicación...</div>,
  ssr: false,
});

export default function LandingPage() {
  const router = useRouter();
  const [filtros, setFiltros] = useState({
    tipoVidrio: '',
    aplicacion: '',
    servicio: ''
  });

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleBuscar = () => {
    const params = new URLSearchParams();
    if (filtros.tipoVidrio) params.set('tipo', filtros.tipoVidrio);
    if (filtros.aplicacion) params.set('aplicacion', filtros.aplicacion);
    if (filtros.servicio) params.set('servicio', filtros.servicio);

    router.push(`/catalogo${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="bg-[#0d131f] text-gray-100 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[650px] flex items-center justify-center border-b border-gray-800">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="https://forbes.es/wp-content/uploads/2022/03/California-2.jpg"
            alt="Modern Glass Architecture Background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d131f] via-[#0d131f]/70 to-black/60"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-5xl px-4 text-center">
          <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full inline-block mb-4">
            Innovación en Vidriería
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-8 tracking-tight drop-shadow-md">
            ¿Buscando nuevas <span className="text-cyan-400">instalaciones de vidrio</span>?
          </h1>

          {/* Buscador de filtros */}
          <div className="bg-[#161f30]/90 backdrop-blur-md border border-gray-700/60 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <select
                value={filtros.tipoVidrio}
                onChange={(e) => handleFiltroChange('tipoVidrio', e.target.value)}
                className="w-full h-12 sm:h-14 pl-4 pr-10 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:border-cyan-500 focus:outline-none text-white font-medium text-sm cursor-pointer transition-colors"
              >
                <option value="" className="bg-[#161f30]">Tipo de Vidrio</option>
                <option value="templado" className="bg-[#161f30]">Vidrio Templado</option>
                <option value="laminado" className="bg-[#161f30]">Vidrio Laminado</option>
                <option value="espejo" className="bg-[#161f30]">Espejos</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <select
                value={filtros.aplicacion}
                onChange={(e) => handleFiltroChange('aplicacion', e.target.value)}
                className="w-full h-12 sm:h-14 pl-4 pr-10 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:border-cyan-500 focus:outline-none text-white font-medium text-sm cursor-pointer transition-colors"
              >
                <option value="" className="bg-[#161f30]">Aplicación</option>
                <option value="ventanas" className="bg-[#161f30]">Ventanas</option>
                <option value="puertas" className="bg-[#161f30]">Puertas</option>
                <option value="divisiones" className="bg-[#161f30]">Divisiones</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <select
                value={filtros.servicio}
                onChange={(e) => handleFiltroChange('servicio', e.target.value)}
                className="w-full h-12 sm:h-14 pl-4 pr-10 bg-gray-900/80 border border-gray-700/80 rounded-xl focus:border-cyan-500 focus:outline-none text-white font-medium text-sm cursor-pointer transition-colors"
              >
                <option value="" className="bg-[#161f30]">Servicios</option>
                <option value="fabricacion" className="bg-[#161f30]">Fabricación</option>
                <option value="instalacion" className="bg-[#161f30]">Instalación</option>
                <option value="mantenimiento" className="bg-[#161f30]">Mantenimiento</option>
              </select>
            </div>

            <button
              onClick={handleBuscar}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold h-12 sm:h-14 px-8 rounded-xl transition-all text-sm w-full md:w-auto shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2"
            >
              <span>Buscar</span>
              <span className="text-lg">🔍</span>
            </button>
          </div>
        </div>
      </div>

      <FeaturedProjectsCarousel />

      {/* Reseñas y Ubicación */}
      <ReviewsCarousel />
      <LocationSection />
    </div>
  );
}