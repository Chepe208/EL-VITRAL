import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = {
  title: 'Sobre Nosotros | El Vitral - Cristalería y Vidrio Arquitectónico',
  description: 'Conoce la historia, misión, valores y trayectoria de El Vitral. Más de 15 años transformando espacios con soluciones en vidrio de seguridad y acabados de lujo.',
};

export default function SobreNosotros() {
  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Luces de ambiente decorativas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] sm:w-[1000px] h-[450px] bg-cyan-500/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute top-[45%] right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[160px] pointer-events-none rounded-full" />

      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-gray-800/80 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 tracking-wider uppercase bg-cyan-950/70 border border-cyan-500/30 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>Maestría Artesanal & Precisión Tecnológica</span>
          </div>

          {/* Gran Título */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Transformamos la luz y los espacios con el poder del{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              vidrio arquitectónico
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal">
            En <strong className="text-white font-semibold">El Vitral</strong> combinamos más de 10 años de pasión artesanal, ingeniería de vanguardia y los más rigurosos estándares de seguridad para dar vida a proyectos que inspiran.
          </p>

          {/* Franja de Estadísticas */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 justify-items-center">
              <div className="w-full bg-[#131b2e]/90 border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 transition-all shadow-xl text-center">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">+10 Años</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">De trayectoria técnica</p>
              </div>
              <div className="w-full bg-[#131b2e]/90 border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 transition-all shadow-xl text-center">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">+1,000</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">Proyectos instalados</p>
              </div>
              <div className="w-full bg-[#131b2e]/90 border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-5 sm:p-6 transition-all shadow-xl text-center">
                <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">100%</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 font-medium">Vidrio certificado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NUESTRA HISTORIA & FILOSOFÍA */}
      <section className="py-16 sm:py-24 border-b border-gray-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Columna Texto */}
            <div className="lg:col-span-6 space-y-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">history_edu</span> Nuestra Trayectoria
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Forjando transparencia y elegancia desde el primer día
              </h2>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Nacimos como un taller familiar impulsado por una convicción simple pero poderosa: el vidrio no es solo un material de cerramiento, sino un elemento arquitectónico capaz de multiplicar la luz, ampliar los espacios y redefinir la forma en que habitamos los lugares.
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Con el paso de los años, hemos evolucionado e invertido continuamente en tecnología de corte computarizado, biselado de precisión y alianzas con los mejores hornos de templado del país, permitiéndonos ejecutar desde divisiones de baño residenciales hasta imponentes fachadas comerciales.
              </p>

              {/* Frase destacada */}
              <div className="border-l-4 border-cyan-400 pl-4 py-2 bg-gradient-to-r from-cyan-950/40 to-transparent rounded-r-xl">
                <p className="text-white italic text-sm sm:text-base font-medium">
                  &ldquo;La verdadera perfección en el vidrio radica en la milimétrica precisión de cada corte y la total seguridad de su montaje.&rdquo;
                </p>
                <span className="text-xs text-cyan-400 font-semibold mt-1 block">— Equipo Directivo El Vitral</span>
              </div>
            </div>

            {/* Columna Imagen & Mosaico Visual */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-3xl overflow-hidden border border-gray-800 shadow-2xl shadow-black/80 aspect-[4/3] sm:aspect-[16/11]">
                <Image
                  src="https://img.freepik.com/fotos-premium/tecnico-que-corta-vidrios-tamano-artesanal-precision-instalacion-produccion-ventanas_964444-31536.jpg"
                  alt="Taller de producción artesanal y tecnológica en El Vitral"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d131f] via-transparent to-black/30" />

                {/* Badge flotante */}
                <div className="absolute bottom-6 left-6 right-6 bg-[#131b2e]/90 backdrop-blur-md border border-cyan-500/30 p-4 rounded-2xl shadow-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Garantía Certificada en Obra</p>
                    <p className="text-xs text-gray-400">Cada proyecto cuenta con respaldo integral y soporte postventa.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MISIÓN Y VISIÓN (Cards Glassmorphic) */}
      <section className="py-16 sm:py-24 bg-[#101726]/70 border-b border-gray-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-sm">flag</span> Nuestro Rumbo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Misión & Visión Estratégica
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base">
              Nuestros pilares fundamentales para liderar la industria de la cristalería y brindar tranquilidad a cada cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Card Misión */}
            <div className="bg-[#141e33] border border-cyan-500/20 hover:border-cyan-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                <span className="material-symbols-outlined text-3xl">track_changes</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2">
                Nuestra Misión
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Brindar productos y servicios de cristalería con los más altos estándares de calidad, seguridad y diseño. Diseñamos ambientes funcionales, modernos y luminosos que enriquecen los espacios de nuestros clientes, garantizando acompañamiento experto desde la primera asesoría hasta la instalación final.
              </p>
            </div>

            {/* Card Visión */}
            <div className="bg-[#141e33] border border-blue-500/20 hover:border-blue-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                <span className="material-symbols-outlined text-3xl">visibility</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2">
                Nuestra Visión
              </h3>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                Consolidarnos como la empresa referente en vidriería arquitectónica y soluciones a medida a nivel nacional, destacándonos por la innovación tecnológica, la excelencia operativa, el compromiso medioambiental y la plena satisfacción de familias, arquitectos y constructoras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VALORES QUE NOS DEFINEN */}
      <section className="py-16 sm:py-24 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-sm">workspace_premium</span> Principios
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              ¿Por qué confiar en <span className="text-cyan-400">El Vitral</span>?
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base">
              Valores innegociables que aplicamos en cada lámina de cristal cortada y montada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">straighten</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Precisión Milimétrica</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Cortes computarizados y canteado fino con tolerancias mínimas para un encaje perfecto y acabados de lujo.
              </p>
            </div>

            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">security</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seguridad Certificada</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Uso exclusivo de vidrio templado y laminado homologado que resiste altos impactos y protege a los tuyos.
              </p>
            </div>

            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Puntualidad en Obra</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Cronogramas claros y cumplimiento estricto en los tiempos pactados de entrega e instalación.
              </p>
            </div>

            <div className="bg-[#141d2e] border border-gray-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">handshake</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Garantía & Postventa</h3>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                Acompañamiento continuo y soporte técnico posinstalación para garantizar la máxima durabilidad de tus cristales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CÓMO TRABAJAMOS (Proceso de 4 pasos) */}
      <section className="py-16 sm:py-24 bg-[#101726]/60 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3">
              <span className="material-symbols-outlined text-sm">alt_route</span> Flujo de Trabajo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              De la idea inicial al resultado final
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base">
              Un proceso ágil, transparente y orientado a superar tus expectativas en cada etapa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Paso 1 */}
            <div className="relative bg-[#131b2e] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-cyan-500/30 block mb-2">01</span>
                <h4 className="text-base font-bold text-white mb-2">Asesoría & Medidas</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Evaluamos tus necesidades y planos para recomendar el tipo de cristal, grosor y perfilería idóneos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-cyan-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">support_agent</span> Asesoría técnica
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative bg-[#131b2e] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-cyan-500/30 block mb-2">02</span>
                <h4 className="text-base font-bold text-white mb-2">Cotización Inmediata</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Te entregamos un presupuesto claro y detallado sin sorpresas ni sobrecostos ocultos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-cyan-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">receipt_long</span> Precios transparentes
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative bg-[#131b2e] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-cyan-500/30 block mb-2">03</span>
                <h4 className="text-base font-bold text-white mb-2">Corte & Fabricación</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Fabricamos y templamos el vidrio con maquinaria de precisión y controles rigurosos de calidad.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-cyan-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">precision_manufacturing</span> Alta tecnología
              </div>
            </div>

            {/* Paso 4 */}
            <div className="relative bg-[#131b2e] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-4xl font-black text-cyan-500/30 block mb-2">04</span>
                <h4 className="text-base font-bold text-white mb-2">Instalación Garantizada</h4>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                  Personal calificado realiza el montaje en obra con fijaciones de acero inoxidable y sellado hermético.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-cyan-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">done_all</span> Entrega de buena calidad
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION FINAL */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-[#141e33] via-[#0f172a] to-[#141e33] p-8 sm:p-14 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
            
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-950/80 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-4">
              <span className="material-symbols-outlined text-sm">handshake</span> Trabajemos Juntos
            </span>

            <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 tracking-tight leading-snug">
              ¿Tienes un proyecto en mente? Hagamos realidad tu visión.
            </h3>

            <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
              Ya sea una división de baño moderna, barandas de cristal templado o la remodelación completa de tu hogar o empresa, contamos con la experiencia para llevarlo a cabo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/cotizar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-950/60 text-sm"
              >
                <span>Solicitar una Cotización</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
              <Link
                href="/catalogo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 hover:text-white border border-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
              >
                <span className="material-symbols-outlined text-base text-cyan-400">inventory_2</span>
                <span>Explorar Catálogo de Productos</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}