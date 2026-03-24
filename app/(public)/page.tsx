import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavBar from '@/components/NavBar';

export default function LandingPage() {
  return (
    <>
      { }
      <NavBar />

      { }
      <div className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="https://forbes.es/wp-content/uploads/2022/03/California-2.jpg"
            alt="Modern Glass Architecture Background"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 w-full max-w-5xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-md">
            ¿Buscando nuevas instalaciones de vidrio?
          </h1>
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl flex flex-col md:flex-row gap-2">
            { }
            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 dark:border-gray-700 focus:ring-0 text-black dark:text-white font-medium text-lg cursor-pointer">
                <option value="">Tipo de Vidrio</option>
                <option value="templado">Vidrio Templado</option>
                <option value="laminado">Vidrio Laminado</option>
                <option value="espejo">Espejos</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-black dark:text-white pointer-events-none">
                expand_more
              </span>
            </div>
            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 dark:border-gray-700 focus:ring-0 text-black-700 dark:text-black-200 font-medium text-lg cursor-pointer">
                <option value="">Aplicación</option>
                <option value="ventanas">Ventanas</option>
                <option value="puertas">Puertas</option>
                <option value="divisiones">Divisiones</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-black-500 pointer-events-none">
                expand_more
              </span>
            </div>
            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 focus:ring-0 text-black-700 dark:text-black-200 font-medium text-lg cursor-pointer">
                <option value="">Servicios</option>
                <option value="fabricacion">Fabricación</option>
                <option value="instalacion">Instalación</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-black-500 pointer-events-none">
                expand_more
              </span>
            </div>
            <button className="bg-primary hover:bg-secondary text-white font-bold h-14 px-10 rounded-md transition-colors text-lg w-full md:w-auto">
              Buscar
            </button>
          </div>
        </div>
      </div>

      { }
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Proyectos destacados
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Descubre nuestros últimos trabajos en cristalería e instalaciones
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            { }
            <Link href="/proyectos/fachada-comercial" className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <Image
                  src="https://vidriostemplex.com/wp-content/uploads/2022/06/PHOTO-2021-11-26-11-01-21-1536x1152.jpg"
                  alt="Fachada de Vidrio Comercial"
                  width={400}
                  height={256}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  Fachada Comercial
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Instalación de vidrio templado para centro comercial.
                </p>
                <div className="flex items-center text-primary dark:text-blue-400 font-medium">
                  Ver detalles{' '}
                  <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
                </div>
              </div>
            </Link>
            { }
            <Link href="/proyectos/divisiones-corporativas" className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <Image
                  src="https://th.bing.com/th/id/R.e021e394864a3ee46e884b5f8c597845?rik=zkzo18kF9sPPNA&pid=ImgRaw&r=0"
                  alt="Divisiones de Oficina de Vidrio"
                  width={400}
                  height={256}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <div className="p-6">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  Divisiones Comparativas
               </h3>
               <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Separadores de ambiente en vidrio laminado acustico.
               </p>
               <div className="flex items-center text-primary dark:text-blue-400 font-medium">
                Ver detalles{' '}
                <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
               </div>
              </div>
            </Link>

            <Link href="/proyectos/barandas-residenciales" className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <Image
                  src="https://lucor.es/wp-content/uploads/2023/01/barandillas-de-vidrio-view-crystal-03.jpg"
                  alt="Barandas de vidrio Residencial"
                  width={400}
                  height={256}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  Barandas Residenciales
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Diseño e instalación de barandas de cristal para exteriores.
                </p>
                <div className=" flex items-center text-primary dark:text-blue-400 font-medium">
                  Ver detalles{' '}
                  <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}