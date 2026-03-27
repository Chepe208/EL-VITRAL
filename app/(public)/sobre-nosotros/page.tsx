import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { testConnection } from '../../../lib/db';

export default async function SobreNosotros() {
    const dbConnected = await testConnection().catch(() => false);
    const dbStatusText = dbConnected ? 'Conexión a la base de datos OK ✅' : 'No se pudo conectar a la base de datos ⚠️';

    return (
        <div className="min-h-screen py-12" style={{ backgroundColor: '#101828'}}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href="/" className="inline-flex items-center text-primary hover:text-secondary mb-8">
                Volver a Inicio
                </Link>

                <div className="rounded-lg shadow-md overflow-hidden" style={{backgroundColor: '#1e2939'}}>
                    <div className="relative h-64 md:h-80">
                        <Image
                          src="https://img.freepik.com/fotos-premium/tecnico-que-corta-vidrios-tamano-artesanal-precision-instalacion-produccion-ventanas_964444-31536.jpg"
                          alt="Taller de vidrio"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                           <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg"> Sobre Nosotros </h1>
                        </div>  
                    </div>

                    <div className="p-8 md:p-12">
                        <h2 className="text-2xl font-bold text-white mb-4">
                            Mas de 20 años dando forma a tus ideas
                        </h2>
                        <p className="text-sm font-medium text-yellow-200 mb-6">{dbStatusText}</p>
                        <p className="text-gray-100 leading-relaxed mb-6">
                            En <strong>El Vitral</strong> somos una empresa familiar con más de dos décadas de experiencia en el sector del vidrio y la cristalería. Nacimos con la pasión por transformar espacios a través de la luz y la transparencia, ofreciendo soluciones a medida para proyectos residenciales, comerciales e industriales.
                        </p>

                        <h3 className="text-xl font-bold text-white mb-3">Nuestra misión</h3>
                        <p className="text-gray-100 leading-relaxed mb-6">
                            Brindar el mejor producto y servicio de alta calidad en vidrio, combinando innovación, seguridad y diseño, para crear ambientes funcionales y estéticamente superiores. Nos comprometemos con la satisfacción de nuestros clientes, la excelencia en cada detalle y el respeto por el medio ambiente.
                        </p>

                        <h3 className="text-xl font-bold text-white mb-3">
                            ¿Qué nos hace diferentes?
                        </h3>
                        <ul className="list-disc list-inside text-gray-100 space-y-2 mb-6">
                            <li>Asesoría personalizada desde el primer contacto.</li>
                            <li>Materiales de primera calidad y procesos certificados.</li>
                            <li>Instalación profesional con garantía.</li>
                            <li>Atención postventa y mantenimiento.</li>
                            <li>Capacidad para desarrollar proyectos a gran escala.</li>
                        </ul>

                        <h3 className="text-xl font-bold text-white mb-3">
                            Nuestro equipo
                        </h3>

                        <p className="text-gray-100 leading-relaxed mb-6">
                            Contamos con un equipo de artesanos, diseñadores y técnicos especializados que trabajan en conjunto para convertir tus ideas en realidad. Cada proyecto es único, y lo tratamos como tal.
                        </p>

                        <div className="bg-black/20 p-6 rounded-lg text-center mt-8"> 
                          <h4 className="text-lg font-semibold text-white mb-2">
                            ¿Tienes un proyecto en mente?
                          </h4>
                          <Link
                          href="/cotizar"
                          className='inline-block bg-primary text-blue-400 px-6 py-2 rounded-md hover:bg-secondary transition-colors'> Solicita una Cotización </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}