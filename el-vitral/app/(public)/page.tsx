import React from 'react';

const ElVitral: React.FC = () => {

  return (
    <>
      {/* Barra superior de inventario */}
      <div className="bg-[#B39DDB] text-center py-2 text-sm font-medium text-gray-900">
        Inventario disponible para{' '}
        <a className="underline font-bold" href="#">
          entrega inmediata
        </a>
      </div>

      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <img
                alt="El Vitral Logo"
                className="h-12 w-auto"
                src="LINK PARA EL LOGO"
              />
            </div>

            {/* Menú de escritorio */}
            <div className="hidden md:flex items-center space-x-8">
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary dark:hover:text-blue-300 font-medium flex items-center gap-1"
                href="#"
              >
                Inicio
              </a>
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary dark:hover:text-blue-300 font-medium flex items-center gap-1"
                href="#"
              >
                Catálogo
              </a>
              <a
                className="text-secondary dark:text-blue-400 hover:text-primary dark:hover:text-blue-300 font-medium flex items-center gap-1"
                href="#"
              >
                Cotizar
              </a>
              

              {/* Buscador */}
              <div className="relative">
                <input
                  className="pl-4 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white w-48 transition-all"
                  placeholder="Buscar producto"
                  type="text"
                />
                <span className="material-symbols-outlined absolute right-3 top-2.5 text-gray-400">
                  search
                </span>
              </div>

              {/* Menú usuario (hover) */}
              <div className="relative group cursor-pointer">
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-3xl">
                  menu
                </span>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block border border-gray-200 dark:border-gray-700">
                  <a
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    href="#"
                  >
                    Iniciar Sesión
                  </a>
                  <a
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    href="#"
                  >
                    Registrarse
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero con buscador */}
      <div className="relative h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 w-full h-full">
          <img
            alt="Modern Glass Architecture Background"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPgLEmADED3vEpHFS6lB99jhubSIKExBrHIXgpnAFxuTG3Aq_7jF42F8O58kxkKOtBbHyCtLwZiBJww69IM9UzSsWGzWANvGhmKS5IXk_ofw_n_Z359bVYX5aO6laiJfoTIbgnbLKbgTBKCy-4hRD0znWWagafzVhiMxKZzLwL89E65BbiyRiTGw1xhmim938mzzoT4JP191OlgdnKnyEnoKnfdcwr-OaMBM9xD4kgGARzkIzHkED5Dmd4nJz94Nse3xs8ZRs0yT2I"
          />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="relative z-10 w-full max-w-5xl px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-md">
            ¿Buscando nuevas instalaciones de vidrio?
          </h1>

          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 dark:border-gray-700 focus:ring-0 text-gray-700 dark:text-gray-200 font-medium text-lg cursor-pointer">
                <option value="">Tipo de Vidrio</option>
                <option value="templado">Vidrio Templado</option>
                <option value="laminado">Vidrio Laminado</option>
                <option value="espejo">Espejos</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-gray-500 pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 dark:border-gray-700 focus:ring-0 text-gray-700 dark:text-gray-200 font-medium text-lg cursor-pointer">
                <option value="">Aplicación</option>
                <option value="ventanas">Ventanas</option>
                <option value="puertas">Puertas</option>
                <option value="divisiones">Divisiones</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-gray-500 pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="flex-1 relative">
              <select className="w-full h-14 pl-4 pr-10 appearance-none bg-transparent border-0 focus:ring-0 text-gray-700 dark:text-gray-200 font-medium text-lg cursor-pointer">
                <option value="">Servicios</option>
                <option value="fabricacion">Fabricación</option>
                <option value="instalacion">Instalación</option>
                <option value="mantenimiento">Mantenimiento</option>
              </select>
              <span className="material-symbols-outlined absolute right-4 top-4 text-gray-500 pointer-events-none">
                expand_more
              </span>
            </div>

            <button className="bg-primary hover:bg-secondary text-white font-bold h-14 px-10 rounded-md transition-colors text-lg w-full md:w-auto">
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Proyectos destacados */}
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
            {/* Tarjeta 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <img
                  alt="Fachada de Vidrio Comercial"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfnr3iqrwo4jDFaFRAYGgrn0YPHSrNelpFP2h078RWEsUvmPkLuR3AQ5kuX0bTj1BvFyJpRt74he1E3lXcGv0yQS0iDYgJF4-YsY20exirmEHyBgYceyAX1R-ABqfN1Jd0u1MVtBLZQ7ec39WVKuP9v-k-9Gf7WUkbUjat3kZBZ5uaAU657zcp1DwakyTcqLzLtgDH93u_8bKfhbKqU0K0Fc7XfAbry7FS1bJp-WYzHmR4M_FbCCrK3nyVL7-w9Rkc0zWHb9eEfBqv"
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
                  <span className="material-symbols-outlined ml-1 text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <img
                  alt="Divisiones de Oficina en Vidrio"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVc7k2kJG47JDqZRrkx2-3Dffxq1dGsWSNmK0voSP4nKnv3ETcykXSwGfbWsr2mL6U4F94G_l4H52fes6BQzt39bcGRC_uJb-ee1DIdTmw7o_9GvrhdhtBKZdrUuANjQ7UvKYx9oh1qeSlfJaf3uEOsryu5oUL_Awa7Z9_BHQ-20sam0zBp9anVgdMwjDd_AvJvs11ICID5QGSV22CmG8veNoatFD2ipYdIaHr2ruDy98l6ZxZsHlQntv-y4eHxzYEF_JcEDxnOolx"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  Divisiones Corporativas
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Separadores de ambiente en vidrio laminado acústico.
                </p>
                <div className="flex items-center text-primary dark:text-blue-400 font-medium">
                  Ver detalles{' '}
                  <span className="material-symbols-outlined ml-1 text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow group cursor-pointer border border-gray-100 dark:border-gray-700">
              <div className="h-64 overflow-hidden">
                <img
                  alt="Barandas de Vidrio Residencial"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfNSmTvARdGJUlEwEwNcaWhBXLEnXSK6r12ZCR754UyM81YYIMKHkiXdPfvjd8TS0h8bG1u46PG-8c61L87_R0O7Gbhti8j14GkSC8CNAVmfft9KJ28Pi0IfQ_sD-Z1kCkjAvO8UTzCNoSpikuHEzPuPmRw0IXviBCOjzvsUsqftmUDViwVBDYChuR6BjLd-qNoBYC6JE4KKDECfH7w9rj1ACzjLM2j3uWkDJLvGTp1PNE1xPUniix2b3hN32Iplpp_BcU49Aml16m"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                  Barandas Residenciales
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Diseño e instalación de barandas de cristal para exteriores.
                </p>
                <div className="flex items-center text-primary dark:text-blue-400 font-medium">
                  Ver detalles{' '}
                  <span className="material-symbols-outlined ml-1 text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ElVitral;