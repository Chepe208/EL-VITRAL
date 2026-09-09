import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default async function SobreNosotros() {
    return (
        <div className="min-h-screen py-12 bg-[#0d131f] text-gray-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="rounded-2xl border border-gray-800 bg-[#161f30] shadow-2xl overflow-hidden">
                    {/* Hero Header */}
                    <div className="relative h-64 md:h-80">
                        <Image
                          src="https://img.freepik.com/fotos-premium/tecnico-que-corta-vidrios-tamano-artesanal-precision-instalacion-produccion-ventanas_964444-31536.jpg"
                          alt="Taller de vidrio"
                          fill
                          sizes="100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161f30] via-[#0d131f]/60 to-black/40 flex items-center justify-center">
                           <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
                             Sobre Nosotros
                           </h1>
                        </div>  
                    </div>

                    {/* Contenido Principal */}
                    <div className="p-8 md:p-12 space-y-8">
                        <div>
                            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase block mb-2">
                                Nuestra Trayectoria
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                Más de 10 años dando forma a tus ideas
                            </h2>
                        </div>

                        <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                            En <strong className="text-cyan-400 font-semibold">El Vitral</strong> somos una empresa familiar con más de diez años de experiencia en el sector del vidrio y la cristalería. Nacimos con la pasión por transformar espacios a través de la luz y la transparencia, ofreciendo soluciones a medida para proyectos residenciales, comerciales e industriales.
                        </p>

                        <div className="border-t border-gray-800/80 pt-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <span className="text-cyan-400">🎯</span> Nuestra Misión
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                                Brindar el mejor producto y servicio de alta calidad en vidrio, combinando innovación, seguridad y diseño, para crear ambientes funcionales y estéticamente superiores. Nos comprometemos con la satisfacción de nuestros clientes, la excelencia en cada detalle y el respeto por el medio ambiente.
                            </p>
                        </div>

                        <div className="border-t border-gray-800/80 pt-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-cyan-400">✨</span> ¿Qué nos hace diferentes?
                            </h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                                <li className="flex items-start gap-2 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                                    <span className="text-cyan-400 font-bold">✓</span>
                                    <span>Asesoría personalizada desde el primer contacto.</span>
                                </li>
                                <li className="flex items-start gap-2 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                                    <span className="text-cyan-400 font-bold">✓</span>
                                    <span>Materiales de primera calidad y procesos certificados.</span>
                                </li>
                                <li className="flex items-start gap-2 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                                    <span className="text-cyan-400 font-bold">✓</span>
                                    <span>Instalación profesional con garantía.</span>
                                </li>
                                <li className="flex items-start gap-2 bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                                    <span className="text-cyan-400 font-bold">✓</span>
                                    <span>Atención postventa y mantenimiento.</span>
                                </li>
                                <li className="flex items-start gap-2 bg-gray-900/50 p-3 rounded-xl border border-gray-800 md:col-span-2">
                                    <span className="text-cyan-400 font-bold">✓</span>
                                    <span>Capacidad para desarrollar proyectos a gran escala.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-800/80 pt-6">
                            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                                <span className="text-cyan-400">👥</span> Nuestro Equipo
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
                                Contamos con un equipo de artesanos, diseñadores y técnicos especializados que trabajan en conjunto para convertir tus ideas en realidad. Cada proyecto es único, y lo tratamos como tal.
                            </p>
                        </div>

                        {/* Call to Action */}
                        <div className="bg-gradient-to-r from-cyan-950/40 via-gray-900 to-gray-900 border border-cyan-500/30 p-6 sm:p-8 rounded-2xl text-center mt-8 shadow-xl"> 
                          <h4 className="text-base sm:text-lg font-bold text-white mb-4">
                            ¿Tienes un proyecto en mente? Cotiza con nosotros y hagamos realidad tu visión.
                          </h4>
                          <Link
                            href="/cotizar"
                            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-950/50 text-xs sm:text-sm"
                          >
                            <span>Solicita una Cotización</span>
                            <span>→</span>
                          </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}