import { notFound } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';

export async function generateStaticParams() {
    const slugs = ['fachada-comercial', 'divisiones-corporativas', 'barandas-residenciales'];
    return slugs.map((slug) => ({ slug }));
}

const proyectos = {
    'fachada-comercial' : {
        titulo: 'Fachada Comercial',
        descripcion: 'Instalacion de vidrio templado para centro comercial',
        imagen: 'https://vidriostemplex.com/wp-content/uploads/2022/06/PHOTO-2021-11-26-11-01-21-1536x1152.jpg',
        detalles: 'Este proyecto cosistio en la instalación de una fachada completa de vidrio templado de 12mm de espesor, con estructura de aluminio anodizado. Se uso un diseño de última generación que permite máxima transparencia y eficencia energética.',
        tecnologias: ['Vidrio Templado', 'Aluminio Anodizado', 'Sellado Estructural'],
    },
    'divisiones-corporativas': {
        titulo: 'Divisiones Corporativas',
        descripcion: 'Separadores de ambiente en vidrio laminado acústico',
        imagen: 'https://th.bing.com/th/id/R.e021e394864a3ee46e884b5f8c597845?rik=zkzo18kF9sPPNA&pid=ImgRaw&r=0',
        detalles: 'Istalación de divisiones modulares en vidrio laminado con cámara acústica para oficinas corporativas. Se logró un ambiente moderno y funcional con excelente aisalamiento sonoro.',
        tecnologias: ['Vidrio Laminado', 'Perfiles de Aluminio', 'Sistemas de Fijacion Invisibles'],
    },
    'barandas-residenciales': {
        titulo: 'Barandas Residenciales',
        descripcion: 'Diseño e instalacion de barandas de cristal para exteriores.',
        imagen: 'https://lucor.es/wp-content/uploads/2023/01/barandillas-de-vidrio-view-crystal-03.jpg',
        detalles: 'Barandas de vidrio templado sin perfiles, fijadas con sistemas ocultos que dan seguridad y elegancia para terrazas y balcones residenciales.',
        tecnologias: ['Vidrio Templado', 'Sujeción Invisble', 'Acero Inoxidable'],
    },
};

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProyectoDetalle({ params }: PageProps) {
    const { slug } = await params;
    const proyecto = proyectos[slug as keyof typeof proyectos];

    if(!proyecto) {
        notFound();
    }

    return (
       <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center text-primary hover:text-secondary mb-8">
              Volver al Inicio        
            </Link>

            <h1 className="text-4xl font-bold text-gray-900 mb-6">{proyecto.titulo}</h1>

            <div className="relative h-[500px] rounded-lg overflow-hidden mb-8 shadow-lg">
                <Image
                src={proyecto.imagen}
                alt={proyecto.titulo}
                fill
                className="object-cover"
                unoptimized
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap8">
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-bold mb-4">Sobre el Proyecto</h2>
                    <p className="text-gray-700 leading-relaxed mb-6">{proyecto.detalles}</p>

                    <h3 className="text-xl font-bold mb-3">Tecnologías utilizadas</h3>
                    <ul className="list-disc list-inside mb-6">
                        {proyecto.tecnologias.map((tec, idx) => (
                            <li key={idx} className="text-gray-700">{tec}</li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold mb-4">¿Interesado en un proyecto similar?</h3>
                    <p className="text-gray-600 mb-4">
                        Contactanos para recibir asesoría personalizada y cotización sin compromiso.
                    </p>
                    <Link 
                     href="/cotizar"
                     className="inline-block w-full text-center bg-primary text-white py-2 rounded-md hover:bg-secondary transition-colors"> 
                     Solicitar cotizacion 
                    </Link>
                </div>
            </div>
        </div>
       </div> 
    );
}