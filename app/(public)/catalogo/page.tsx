'use client';
import { useEffect, useState } from "react";
import Image from 'next/image';
import Link from "next/link";

interface Producto {
    id:number;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen_url:string | null;
    unidad_medida: string;
    precio_base: number;
}

export default function CatalogoPage() {
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

    const productosFiltrados = filtro === 'todos'
    ? productos
    :productos.filter(p => p.tipo === filtro);

    if (loading){
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#101828'}}>
                <div className="text-white text-xl">Cargando catálogo...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12" style={{ backgroundColor:'#101828' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-white mb-8">Catálogo de Productos</h1>

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
                            <div className="h-64 relative">
                                <Image
                                  src={producto.imagen_url || '/placeholder-product.jpg'}
                                  alt={producto.nombre}
                                  fill
                                  className="object-cover"
                                  />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{producto.nombre}</h3>
                                <p className="text-gray-200 mb-4">{producto.descripcion}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-primary font-bold text-xl">
                                        ${producto.precio_base.toFixed(2)} / {producto.unidad_medida}
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