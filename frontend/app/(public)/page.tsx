'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LazyHomeSections from '@/components/LazyHomeSections';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const [filtros, setFiltros] = useState({
    tipoVidrio: '',
    aplicacion: '',
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

    router.push(`/catalogo${params.toString() ? '?' + params.toString() : ''}`);
  };

  const aplicarFiltroRapido = (tipo: string, app: string = '') => {
    setFiltros({ tipoVidrio: tipo, aplicacion: app });
    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (app) params.set('aplicacion', app);
    router.push(`/catalogo${params.toString() ? '?' + params.toString() : ''}`);
  };

  return (
    <div className="bg-[#0d131f] text-gray-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Hero Section */}
      <section className="relative min-h-[660px] sm:min-h-[720px] lg:min-h-[760px] flex flex-col items-center justify-center border-b border-gray-800/80 py-20 sm:py-28 overflow-hidden">
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="https://forbes.es/wp-content/uploads/2022/03/California-2.jpg"
            alt="Arquitectura moderna en vidrio"
            fill
            sizes="100vw"
            className="object-cover scale-105 transition-transform duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#0d131f]/80 to-[#0d131f]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/15 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 mx-auto text-center flex flex-col items-center justify-center">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2.5 text-xs font-semibold text-cyan-300 tracking-wider uppercase bg-cyan-950/70 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md shadow-lg shadow-cyan-950/40 mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Innovación en Vidriería & Acabados Arquitectónicos</span>
          </div>

          {/* Titular Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight drop-shadow-md leading-[1.15] text-center max-w-4xl mx-auto">
            ¿Buscando nuevas{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              instalaciones de vidrio
            </span>?
          </h1>

          {/* Subtítulo descriptivo */}
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 font-normal leading-relaxed text-center">
            Fabricación a medida, corte de alta precisión e instalación certificada de vidrios templados, divisiones de baño, barandas y espejos decorativos.
          </p>

          {/* Buscador de 2 Filtros + Botón Buscar */}
          <div className="w-full max-w-4xl mx-auto bg-[#121a2b]/90 backdrop-blur-xl border border-gray-700/70 hover:border-cyan-500/40 transition-colors p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/60">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-center w-full">
              {/* Filtro 1: Tipo de Vidrio */}
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                  <span className="material-symbols-outlined text-xl">grid_view</span>
                </div>
                <select
                  value={filtros.tipoVidrio}
                  onChange={(e) => handleFiltroChange('tipoVidrio', e.target.value)}
                  className="w-full h-12 sm:h-14 pl-11 pr-10 bg-gray-900/90 border border-gray-700/80 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-white font-medium text-sm cursor-pointer transition-all appearance-none"
                  aria-label="Tipo de Vidrio"
                >
                  <option value="" className="bg-[#121a2b] text-gray-300">Tipo de Vidrio (Todos)</option>
                  <option value="templado" className="bg-[#121a2b] text-white">Vidrio Templado</option>
                  <option value="laminado" className="bg-[#121a2b] text-white">Vidrio Laminado</option>
                  <option value="espejo" className="bg-[#121a2b] text-white">Espejos</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-cyan-400 transition-colors">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>

              {/* Filtro 2: Aplicación */}
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                  <span className="material-symbols-outlined text-xl">door_front</span>
                </div>
                <select
                  value={filtros.aplicacion}
                  onChange={(e) => handleFiltroChange('aplicacion', e.target.value)}
                  className="w-full h-12 sm:h-14 pl-11 pr-10 bg-gray-900/90 border border-gray-700/80 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none text-white font-medium text-sm cursor-pointer transition-all appearance-none"
                  aria-label="Aplicación"
                >
                  <option value="" className="bg-[#121a2b] text-gray-300">Aplicación (Todas)</option>
                  <option value="ventanas" className="bg-[#121a2b] text-white">Ventanas</option>
                  <option value="puertas" className="bg-[#121a2b] text-white">Puertas</option>
                  <option value="divisiones" className="bg-[#121a2b] text-white">Divisiones</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400 group-hover:text-cyan-400 transition-colors">
                  <span className="material-symbols-outlined text-lg">expand_more</span>
                </div>
              </div>

              {/* Botón Buscar */}
              <button
                type="button"
                onClick={handleBuscar}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white font-bold h-12 sm:h-14 px-8 rounded-xl transition-all duration-200 text-sm w-full md:w-auto shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <span>Buscar</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">search</span>
              </button>
            </div>
          </div>

          {/* Sugerencias Rápidas */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-cyan-400">trending_up</span> Populares:
            </span>
            <button
              onClick={() => aplicarFiltroRapido('templado')}
              className="px-3 py-1 rounded-full bg-gray-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 border border-gray-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              Vidrio Templado
            </button>
            <button
              onClick={() => aplicarFiltroRapido('', 'divisiones')}
              className="px-3 py-1 rounded-full bg-gray-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 border border-gray-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              Divisiones de Baño
            </button>
            <button
              onClick={() => aplicarFiltroRapido('espejo')}
              className="px-3 py-1 rounded-full bg-gray-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 border border-gray-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              Espejos Flotantes
            </button>
            <button
              onClick={() => aplicarFiltroRapido('laminado')}
              className="px-3 py-1 rounded-full bg-gray-800/80 hover:bg-cyan-950/80 hover:text-cyan-300 border border-gray-700/60 hover:border-cyan-500/40 transition-all cursor-pointer"
            >
              Vidrio Laminado
            </button>
          </div>
        </div>
      </section>

      {/* Franja de Métricas y Confianza */}
      <section className="border-b border-gray-800 bg-[#101726]/60 backdrop-blur-sm py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">+10 Años</p>
                <p className="text-xs text-gray-400 font-medium">Experiencia técnica y calidad</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <span className="material-symbols-outlined text-2xl">shield</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">100% Seguro</p>
                <p className="text-xs text-gray-400 font-medium">Vidrios bajo norma técnica</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <span className="material-symbols-outlined text-2xl">apartment</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">+1,000 Obras</p>
                <p className="text-xs text-gray-400 font-medium">Proyectos instalados con éxito</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
                <span className="material-symbols-outlined text-2xl">calculate</span>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white tracking-tight">Cotizador Online</p>
                <p className="text-xs text-gray-400 font-medium">Presupuesto instantáneo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Soluciones y Beneficios */}
      <section className="py-16 sm:py-24 bg-[#0d131f] border-b border-gray-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full inline-block mb-3">
              ¿Por qué elegir El Vitral?
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Excelencia artesanal y tecnología en <span className="text-cyan-400">cada proyecto</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-400 leading-relaxed">
              Combinamos materiales de primera categoría con mano de obra calificada para brindar seguridad, luminosidad y diseño a cada espacio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <span className="material-symbols-outlined text-2xl">verified_user</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Vidrios de Seguridad
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Templado y laminado de alto impacto con resistencia térmica, diseñado para brindar máxima protección en todo momento.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <span className="material-symbols-outlined text-2xl">shower</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Divisiones & Baños
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Divisiones batientes o corredizas con herrajes inoxidables de alta precisión, sellado hermético y elegancia moderna.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <span className="material-symbols-outlined text-2xl">flare</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Espejos & Decoración
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Espejos flotantes, con luz led cálida/fría y biselados pulidos para realzar la amplitud y belleza de tus habitaciones.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/30 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <span className="material-symbols-outlined text-2xl">handyman</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Instalación Especializada
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Equipo técnico capacitado para mediciones en obra, transporte cuidadoso y anclaje profesional garantizado.
              </p>
            </div>
          </div>

          {/* Banners de acción rápida */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalogo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-950/60"
            >
              <span>Explorar Todo el Catálogo</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
            <a
              href="#calculadora-precios"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gray-800/90 hover:bg-gray-700/90 text-gray-200 hover:text-white border border-gray-700 font-semibold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-lg text-cyan-400">calculate</span>
              <span>Calcular Presupuesto Online</span>
            </a>
          </div>
        </div>
      </section>

      {/* Secciones con carga diferida: Proyectos, Reseñas, Calculadora y Ubicación */}
      <LazyHomeSections />
    </div>
  );
}