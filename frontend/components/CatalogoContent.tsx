'use client';
import { useEffect, useMemo, useState, useTransition } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatNumber } from '@/lib/format';

interface Producto {
    id: number;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen_url: string | null;
    unidad_medida: string;
    precio_base: number;
}

// Iconos y etiquetas para cada tipo de producto
const tipoConfig: Record<string, { icono: string; label: string }> = {
    vidrio: { icono: '🪟', label: 'Vidrios' },
    espejo: { icono: '🪞', label: 'Espejos' },
    aluminio: { icono: '🔩', label: 'Perfiles' },
    herraje: { icono: '🔧', label: 'Herrajes' },
    insumo: { icono: '📦', label: 'Insumos' },
};

export default function CatalogoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [orden, setOrden] = useState<'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre-asc'>('relevancia');

    const tipoParam = searchParams.get('tipo');
    const aplicacionParam = searchParams.get('aplicacion');

    // Mapeo inicial inteligente si viene del buscador de la landing
    const filtroInicial = useMemo(() => {
        if (!tipoParam || tipoParam === 'todos') return 'todos';
        if (tipoParam === 'templado' || tipoParam === 'laminado') return 'vidrio';
        return tipoParam;
    }, [tipoParam]);

    const [filtro, setFiltroLocal] = useState<string>(filtroInicial);

    // Sincronizar filtro cuando cambie el query param
    useEffect(() => {
        setFiltroLocal(filtroInicial);
        if (tipoParam === 'templado') {
            setBusqueda('templado');
        } else if (tipoParam === 'laminado') {
            setBusqueda('laminado');
        }
    }, [filtroInicial, tipoParam]);

    useEffect(() => {
        const controller = new AbortController();
        const cached = window.sessionStorage.getItem('catalogo-productos');
        let cacheTimer: ReturnType<typeof setTimeout> | undefined;

        if (cached) {
            try {
                const cachedProducts = JSON.parse(cached) as Producto[];
                cacheTimer = setTimeout(() => {
                    setProductos(cachedProducts);
                    setLoading(false);
                }, 0);
            } catch {
                window.sessionStorage.removeItem('catalogo-productos');
            }
        }

        fetch('/api/productos/publicos', { signal: controller.signal })
            .then(res => {
                if (!res.ok) throw new Error('No se pudieron cargar los productos');
                return res.json();
            })
            .then(data => {
                setProductos(data);
                window.sessionStorage.setItem('catalogo-productos', JSON.stringify(data));
            })
            .catch(error => {
                if (error.name !== 'AbortError') setLoading(false);
            })
            .finally(() => setLoading(false));

        return () => {
            controller.abort();
            if (cacheTimer) clearTimeout(cacheTimer);
        };
    }, []);

    const calcularPrecioReal = (prod: Producto) => {
        return (prod.tipo === 'vidrio' || prod.tipo === 'espejo')
            ? prod.precio_base * 1000
            : prod.precio_base;
    };

    const setFiltro = (nuevoFiltro: string) => {
        setFiltroLocal(nuevoFiltro);
        const params = new URLSearchParams(window.location.search);
        if (nuevoFiltro === 'todos') {
            params.delete('tipo');
        } else {
            params.set('tipo', nuevoFiltro);
        }
        startTransition(() => {
            router.push(`/catalogo?${params.toString()}`, { scroll: false });
        });
    };

    const limpiarTodosLosFiltros = () => {
        setFiltroLocal('todos');
        setBusqueda('');
        setOrden('relevancia');
        router.push('/catalogo', { scroll: false });
    };

    // Filtrado combinado: Categoría + Texto de Búsqueda + Aplicación
    const productosFiltrados = useMemo(() => {
        let list = [...productos];

        // Filtro de Categoría
        if (filtro !== 'todos') {
            list = list.filter(p => p.tipo.toLowerCase() === filtro.toLowerCase());
        }

        // Filtro de Texto (Búsqueda por nombre o descripción)
        if (busqueda.trim()) {
            const queryClean = busqueda.toLowerCase().trim();
            list = list.filter(p =>
                p.nombre.toLowerCase().includes(queryClean) ||
                (p.descripcion && p.descripcion.toLowerCase().includes(queryClean))
            );
        }

        // Ordenamiento
        if (orden === 'precio-asc') {
            list.sort((a, b) => calcularPrecioReal(a) - calcularPrecioReal(b));
        } else if (orden === 'precio-desc') {
            list.sort((a, b) => calcularPrecioReal(b) - calcularPrecioReal(a));
        } else if (orden === 'nombre-asc') {
            list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        }

        return list;
    }, [productos, filtro, busqueda, orden]);

    // Contador por tipo
    const contarPorTipo = (tipoKey: string) => {
        if (tipoKey === 'todos') return productos.length;
        return productos.filter(p => p.tipo.toLowerCase() === tipoKey.toLowerCase()).length;
    };

    const categoriasDisponibles = ['todos', 'vidrio', 'espejo', 'aluminio', 'herraje', 'insumo'];

    return (
        <div className="min-h-screen bg-[#0d131f] text-gray-100">
            {/* Header / Hero del Catálogo */}
            <div className="relative border-b border-gray-800 bg-gradient-to-b from-[#131b2e] to-[#0d131f] py-12 sm:py-16 overflow-hidden">
                <div className="absolute top-0 right-1/4 w-80 h-80 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="max-w-3xl">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase bg-cyan-950/80 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3 shadow-inner">
                            <span className="material-symbols-outlined text-sm">inventory_2</span> Catálogo Completo
                        </span>
                        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                            Materiales & Soluciones en <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">Vidrio</span>
                        </h1>
                        <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
                            Explora nuestra gama certificada de vidrios templados, laminados, espejos, perfiles de aluminio y herrajes con cotización inmediata.
                        </p>
                    </div>

                    {/* Barra de Búsqueda y Ordenamiento */}
                    <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyan-400">
                                <span className="material-symbols-outlined text-xl">search</span>
                            </div>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre, grosor (ej. 5mm, 8mm, 10mm) o características..."
                                className="w-full h-12 pl-11 pr-10 bg-[#162033] border border-gray-700/80 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none transition-all shadow-inner"
                            />
                            {busqueda && (
                                <button
                                    onClick={() => setBusqueda('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <span className="material-symbols-outlined text-lg">cancel</span>
                                </button>
                            )}
                        </div>

                        {/* Selector de Orden */}
                        <div className="relative shrink-0 min-w-[200px]">
                            <select
                                value={orden}
                                onChange={(e) => setOrden(e.target.value as any)}
                                className="w-full h-12 pl-4 pr-10 bg-[#162033] border border-gray-700/80 focus:border-cyan-500 focus:outline-none rounded-xl text-sm text-white font-medium appearance-none cursor-pointer"
                                aria-label="Ordenar productos"
                            >
                                <option value="relevancia" className="bg-[#131b2e]">Ordenar: Relevancia</option>
                                <option value="precio-asc" className="bg-[#131b2e]">Precio: Menor a Mayor</option>
                                <option value="precio-desc" className="bg-[#131b2e]">Precio: Mayor a Menor</option>
                                <option value="nombre-asc" className="bg-[#131b2e]">Nombre: A - Z</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-lg">unfold_more</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Pestañas de Categoría */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-gray-800/80 mb-6">
                    {categoriasDisponibles.map((catKey) => {
                        const count = contarPorTipo(catKey);
                        if (catKey !== 'todos' && count === 0) return null;

                        const isSelected = filtro === catKey;
                        const info = catKey === 'todos'
                            ? { icono: '✨', label: 'Todos los productos' }
                            : (tipoConfig[catKey] || { icono: '📦', label: catKey.toUpperCase() });

                        return (
                            <button
                                key={catKey}
                                onClick={() => setFiltro(catKey)}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                                    isSelected
                                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/60 border border-cyan-400/40 scale-[1.02]'
                                        : 'bg-[#141d2e] hover:bg-[#1b263b] text-gray-300 hover:text-white border border-gray-700/60'
                                }`}
                            >
                                <span className="text-sm sm:text-base">{info.icono}</span>
                                <span>{info.label}</span>
                                <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                        isSelected ? 'bg-black/30 text-white' : 'bg-gray-800 text-gray-400'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filtros Activos / Resumen de resultados */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">
                        Mostrando <span className="text-cyan-400 font-bold">{productosFiltrados.length}</span>{' '}
                        {productosFiltrados.length === 1 ? 'producto encontrado' : 'productos disponibles'}
                    </p>

                    {(filtro !== 'todos' || busqueda || aplicacionParam) && (
                        <div className="flex flex-wrap items-center gap-2">
                            {filtro !== 'todos' && (
                                <span className="inline-flex items-center gap-1 bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs px-2.5 py-1 rounded-full">
                                    Categoría: {filtro}
                                    <button onClick={() => setFiltro('todos')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 bg-blue-950/70 border border-blue-500/30 text-blue-300 text-xs px-2.5 py-1 rounded-full">
                                    Búsqueda: &ldquo;{busqueda}&rdquo;
                                    <button onClick={() => setBusqueda('')} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                            {aplicacionParam && (
                                <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                                    Aplicación: {aplicacionParam}
                                </span>
                            )}
                            <button
                                onClick={limpiarTodosLosFiltros}
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2 ml-2 cursor-pointer"
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* Estado: Cargando Skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                            <div
                                key={item}
                                className="bg-[#131c2e] border border-gray-800 rounded-2xl overflow-hidden h-[360px] animate-pulse flex flex-col justify-between p-4"
                            >
                                <div className="h-44 bg-gray-800/80 rounded-xl mb-3" />
                                <div className="space-y-2 px-1">
                                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                                    <div className="h-3 bg-gray-800/60 rounded w-full" />
                                </div>
                                <div className="h-10 bg-gray-800/50 rounded-xl mt-4" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Grid de Productos */}
                {!loading && productosFiltrados.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {productosFiltrados.map((producto) => {
                            const config = tipoConfig[producto.tipo] || { icono: '📦', label: producto.tipo };
                            const precioMostrar = calcularPrecioReal(producto);

                            return (
                                <div
                                    key={producto.id}
                                    className="bg-[#131c2e] hover:bg-[#162238] border border-gray-800/90 hover:border-cyan-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-950/40 group flex flex-col justify-between"
                                >
                                    {/* Imagen y Badges */}
                                    <div>
                                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
                                            {producto.imagen_url ? (
                                                <Image
                                                    src={producto.imagen_url}
                                                    alt={producto.nombre}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    loading="lazy"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-106"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                    <span className="text-5xl mb-2">{config.icono}</span>
                                                    <span className="text-xs font-medium">Foto referencial</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-[#131c2e] via-transparent to-transparent opacity-60 pointer-events-none" />

                                            {/* Badge de Categoría */}
                                            <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-sm">
                                                <span>{config.icono}</span>
                                                <span className="capitalize">{producto.tipo}</span>
                                            </span>

                                            {/* Badge de Unidad */}
                                            <span className="absolute bottom-3 right-3 bg-cyan-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/30 text-[11px] px-2.5 py-1 rounded-full font-bold">
                                                {producto.unidad_medida}
                                            </span>
                                        </div>

                                        {/* Información */}
                                        <div className="p-5">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 group-hover:text-cyan-300 transition-colors line-clamp-1">
                                                {producto.nombre}
                                            </h3>
                                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                                                {producto.descripcion || 'Material de alta calidad para instalación y corte a medida.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pie: Precio y Botón Cotizar */}
                                    <div className="p-5 pt-0">
                                        <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                                                    Precio ref.
                                                </p>
                                                <div className="flex items-baseline">
                                                    <span className="text-xl sm:text-2xl font-black text-white">
                                                        ${formatNumber(precioMostrar)}
                                                    </span>
                                                    <span className="text-gray-400 text-xs ml-1 font-medium">
                                                        COP
                                                    </span>
                                                </div>
                                            </div>

                                            <Link
                                                href={`/cotizar?producto=${producto.id}`}
                                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-md shadow-cyan-950/60 hover:shadow-cyan-500/30"
                                            >
                                                <span>Cotizar</span>
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Estado: No hay coincidencias */}
                {!loading && productosFiltrados.length === 0 && (
                    <div className="text-center py-16 bg-[#131c2e] border border-gray-800 rounded-3xl p-8 max-w-xl mx-auto shadow-2xl">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl">search_off</span>
                        </div>
                        <h2 className="text-white text-xl font-bold mb-2">
                            No encontramos productos con esos criterios
                        </h2>
                        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                            Prueba ajustando el término de búsqueda, seleccionando otra categoría o restablece los filtros para ver todo el catálogo.
                        </p>
                        <button
                            onClick={limpiarTodosLosFiltros}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/60 text-sm cursor-pointer"
                        >
                            Ver todos los productos
                        </button>
                    </div>
                )}

                {/* Banner de Ayuda / Asesoría Personalizada */}
                <div className="mt-16 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-[#141e33] via-[#101726] to-[#141e33] p-8 sm:p-10 text-center relative overflow-hidden shadow-2xl">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full mb-4">
                            <span className="material-symbols-outlined text-sm">support_agent</span> Asesoría Inmediata
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
                            ¿Necesitas una medida especial o producto personalizado?
                        </h3>
                        <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                            Fabricamos y modulamos cristales de seguridad según tus planos. Comunícate con nuestros asesores técnicos o calcula tu presupuesto en nuestro cotizador digital.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                            <a
                                href="tel:3137928483"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-950/60 text-sm"
                            >
                                <span className="material-symbols-outlined text-lg">call</span>
                                <span>Llamar al 3137928483</span>
                            </a>
                            <Link
                                href="/#calculadora-precios"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-800/90 hover:bg-gray-700/90 text-gray-200 hover:text-white border border-gray-700 font-semibold px-6 py-3 rounded-xl transition-all text-sm"
                            >
                                <span className="material-symbols-outlined text-lg text-cyan-400">calculate</span>
                                <span>Calcular Presupuesto Online</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}