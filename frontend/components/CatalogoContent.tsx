'use client';
import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';

interface Producto {
    id: number;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen_url: string | null;
    unidad_medida: string;
    precio_base: number;
}

const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Iconos para cada tipo (para mostrar en las tarjetas)
const tipoIcono = {
    vidrio: '🪟',
    espejo: '🪞',
    aluminio: '🔩',
    accesorio: '🔧',
};

export default function CatalogoContent() {
    const searchParams = useSearchParams();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState('todos');

    useEffect(() => {
        fetch('/api/productos')
            .then(res => res.json())
            .then(data => {
                setProductos(data);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        const tipo = searchParams.get('tipo');
        const aplicacion = searchParams.get('aplicacion');
        const servicio = searchParams.get('servicio');

        if (tipo) {
            const tipoMapeado = tipo === 'templado' || tipo === 'laminado' ? 'vidrio' : tipo;
            setFiltro(tipoMapeado);
        } else if (aplicacion || servicio) {
            setFiltro('todos');
        }
    }, [searchParams]);

    const productosFiltrados = productos.filter(producto => {
        if (filtro === 'todos') return true;
        return producto.tipo.toLowerCase() === filtro.toLowerCase();
    });

    // Agrupar por tipo para mostrar el contador
    const contarPorTipo = (tipo: string) => {
        if (tipo === 'todos') return productos.length;
        return productos.filter(p => p.tipo.toLowerCase() === tipo.toLowerCase()).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0b1120' }}>
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white text-lg font-medium">Cargando productos...</p>
                    <p className="text-gray-400 text-sm">Estamos preparando el catálogo para ti</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0b1120' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Encabezado */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            Catálogo de Productos
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {productosFiltrados.length} productos disponibles
                        </p>
                    </div>
                    
                </div>

                {/* Filtros mejorados */}
                <div className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-white/5">
                    {['todos', 'vidrio', 'accesorio', 'espejo', 'aluminio'].map((tipo) => {
                        // Solo mostrar tipos que tengan al menos un producto, excepto 'todos'
                        if (tipo !== 'todos' && contarPorTipo(tipo) === 0) return null;
                        const label = tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1);
                        const count = contarPorTipo(tipo);
                        return (
                            <button
                                key={tipo}
                                onClick={() => setFiltro(tipo)}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                                    ${filtro === tipo
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                        : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                                    }`}
                            >
                                {tipo !== 'todos' && (
                                    <span className="text-base">{tipoIcono[tipo as keyof typeof tipoIcono] || '📦'}</span>
                                )}
                                {label}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${filtro === tipo ? 'bg-white/20' : 'bg-white/10'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Grid de productos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {productosFiltrados.map(producto => (
                        <div
                            key={producto.id}
                            className="group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                            style={{
                                backgroundColor: '#1a2438',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {/* Contenedor de imagen */}
                            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                                {producto.imagen_url ? (
                                    <Image
                                        src={producto.imagen_url}
                                        alt={producto.nombre}
                                        width={400}
                                        height={300}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <span className="text-6xl mb-2">📦</span>
                                        <span className="text-sm">Sin imagen</span>
                                    </div>
                                )}
                                {/* Badge de tipo */}
                                <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                                    <span>{tipoIcono[producto.tipo as keyof typeof tipoIcono] || '📦'}</span>
                                    {producto.tipo}
                                </span>
                                {/* Badge de unidad de medida */}
                                <span className="absolute bottom-3 right-3 bg-primary/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                                    {producto.unidad_medida}
                                </span>
                            </div>

                            {/* Contenido */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                    {producto.nombre}
                                </h3>
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                                    {producto.descripcion}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <div>
                                        <span className="text-2xl font-bold text-primary">
                                            ${formatPrice(producto.precio_base)}
                                        </span>
                                        <span className="text-gray-500 text-sm ml-1">/ {producto.unidad_medida}</span>
                                    </div>
                                    <Link
                                        href={`/cotizar?producto=${producto.id}`}
                                        className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/80 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 group-hover:scale-105"
                                    >
                                        Cotizar
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mensaje cuando no hay productos */}
                {productosFiltrados.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-white text-xl font-medium">No encontramos productos en esta categoría</p>
                        <p className="text-gray-400 mt-2">Prueba con otro filtro o visita todas las opciones.</p>
                        <button
                            onClick={() => setFiltro('todos')}
                            className="mt-4 bg-primary/20 hover:bg-primary/30 text-primary font-medium px-6 py-2 rounded-full transition-colors"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}

                {/* Sección de ayuda */}
                <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 text-center backdrop-blur-sm">
                    <p className="text-white text-xl font-semibold mb-2">¿No encontraste lo que buscabas?</p>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Llámanos al <span className="text-primary font-bold">3137928483</span> y te ayudamos a encontrar la mejor solución para tu proyecto.
                    </p>
                    
                </div>
            </div>
        </div>
    );
}