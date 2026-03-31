'use client';
import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from "next/link";
import NavBar from '@/components/NavBar';
import { useSearchParams } from 'next/navigation';

interface Producto {
    id:number;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen_url:string | null;
    unidad_medida: string;
    precio_base: number;
}

const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export default function CatalogoPage() {
    const searchParams = useSearchParams();
    const [productos, setProductos] =useState<Producto[]>([]);
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

    const productosFiltrados = filtro === 'todos'
    ? productos
    :productos.filter(p => p.tipo === filtro);

    if (loading){
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828'}}>
                <NavBar />
                <div className="text-white text-xl">Cargando catálogo...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor:'#101828' }}>
            <NavBar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-white mb-8">Catálogo de Productos</h1>

                {}
                {(searchParams.get('tipo') || searchParams.get('aplicacion') || searchParams.get('servicio')) && (
                    <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                            Resultados de búsqueda:
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {searchParams.get('tipo') && (
                                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                    Tipo: {searchParams.get('tipo')}
                                </span>
                            )}
                            {searchParams.get('aplicacion') && (
                                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                    Aplicación: {searchParams.get('aplicacion')}
                                </span>
                            )}
                            {searchParams.get('servicio') && (
                                <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                                    Servicio: {searchParams.get('servicio')}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                setFiltro('todos');
                                window.history.replaceState({}, '', '/catalogo');
                            }}
                            className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}

                <div className="mb-8 flex gap-4">
                    <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white"
                    >
                        <option value="todos">Todos</option>
                        <option value="vidrio">Vidrio</option>
                        <option value="espejo">Espejo</option>
                        <option value="aluminio">Aluminio</option>
                        <option value="herraje">Herraje</option>
                        <option value="insumo">Insumo</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {productosFiltrados.map((producto) => (
                        <div key={producto.id} className="rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow" style={{ backgroundColor: '#1e2939' }}>
                            <div className="h-64 relative bg-gray-200 flex items-center justify-center">
                                {producto.imagen_url ? (
                                  <Image
                                    src={producto.imagen_url}
                                    alt={producto.nombre}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="text-gray-500 text-center">
                                    <div className="text-4xl mb-2">📦</div>
                                    <div className="text-sm">Sin imagen</div>
                                  </div>
                                )}
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{producto.nombre}</h3>
                                <p className="text-gray-200 mb-4">{producto.descripcion || 'Sin descripción'}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary font-bold text-xl">
                                        ${formatPrice(producto.precio_base)}{producto.unidad_medida && `/ ${producto.unidad_medida}`}
                                    </span>
                                    <Link
                                    href={`/cotizar?producto=${producto.id}`}
                                    className="bg-primary text-blue-400 px-4 py-2 rounded-md hover:bg-secondary transition-colors"
                                    >
                                        Cotizar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}