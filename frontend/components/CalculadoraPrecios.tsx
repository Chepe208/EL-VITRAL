'use client';

import React, { useState, useEffect, useId } from 'react';
import Link from 'next/link';
import {
  BaseProducto,
  calcularPrecioItem,
  requiereLargo,
  requiereAncho,
  formatPriceCOP,
} from '@/lib/calculoPrecios';

const MEDIDA_MAXIMA_CM = 250;

interface ItemCalculoPublico {
  uid: string;
  producto_id: number;
  nombre: string;
  tipo: string;
  unidad_medida?: string;
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
  medida_largo_calculo?: number;
  medida_ancho_calculo?: number;
  precioUnitario: number;
  subtotal: number;
}

export default function CalculadoraPrecios() {
  const [productos, setProductos] = useState<BaseProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Formulario para nuevo producto
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number | ''>(1);
  const [medidaLargo, setMedidaLargo] = useState<string>('');
  const [medidaAncho, setMedidaAncho] = useState<string>('');
  const [mensajeValidacion, setMensajeValidacion] = useState<string | null>(null);

  // Lista en memoria de productos añadidos
  const [items, setItems] = useState<ItemCalculoPublico[]>([]);

  // Accesibilidad: IDs únicos para inputs
  const selectId = useId();
  const largoId = useId();
  const anchoId = useId();
  const cantidadId = useId();

  // Consulta de solo lectura a productos públicos (sin stock ni datos administrativos)
  useEffect(() => {
    let cancelado = false;

    fetch('/api/productos/publicos')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('No fue posible cargar el listado de productos disponibles.');
        }
        return res.json();
      })
      .then((data: BaseProducto[]) => {
        if (!cancelado) {
          if (Array.isArray(data)) {
            setProductos(data);
          } else {
            setProductos([]);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setErrorCarga(err.message || 'Error de conexión al cargar productos.');
          setLoading(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const productoActual = productos.find((p) => p.id === Number(productoSeleccionadoId));
  const tipoActual = productoActual?.tipo || '';
  const pideLargo = requiereLargo(tipoActual);
  const pideAncho = requiereAncho(tipoActual);

  // Reset de campos al cambiar de producto
  const handleCambiarProducto = (nuevoId: string) => {
    setProductoSeleccionadoId(nuevoId);
    setMensajeValidacion(null);
    const prod = productos.find((p) => p.id === Number(nuevoId));
    const tipo = prod?.tipo || '';
    if (!requiereLargo(tipo)) setMedidaLargo('');
    if (!requiereAncho(tipo)) setMedidaAncho('');
  };

  const handleAgregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeValidacion(null);

    if (!productoActual) {
      setMensajeValidacion('Por favor selecciona un producto para calcular.');
      return;
    }

    const cantNum = Math.floor(Number(cantidad));
    if (isNaN(cantNum) || cantNum <= 0) {
      setMensajeValidacion('La cantidad debe ser un número entero mayor a 0.');
      return;
    }

    if (cantNum > 999) {
      setMensajeValidacion('Para cantidades superiores a 999 unidades, por favor contáctanos directamente.');
      return;
    }

    const numLargo = pideLargo ? parseFloat(medidaLargo) : undefined;
    const numAncho = pideAncho ? parseFloat(medidaAncho) : undefined;

    if (pideLargo && (!numLargo || numLargo <= 0 || isNaN(numLargo))) {
      setMensajeValidacion('Ingresa una medida de largo válida en centímetros (mayor a 0).');
      return;
    }

    if (pideLargo && numLargo && numLargo > MEDIDA_MAXIMA_CM) {
      setMensajeValidacion(`La medida de largo no puede exceder los ${MEDIDA_MAXIMA_CM} cm.`);
      return;
    }

    if (pideAncho && (!numAncho || numAncho <= 0 || isNaN(numAncho))) {
      setMensajeValidacion('Ingresa una medida de ancho válida en centímetros (mayor a 0).');
      return;
    }

    if (pideAncho && numAncho && numAncho > MEDIDA_MAXIMA_CM) {
      setMensajeValidacion(`La medida de ancho no puede exceder los ${MEDIDA_MAXIMA_CM} cm.`);
      return;
    }

    const resultado = calcularPrecioItem(productoActual, {
      cantidad: cantNum,
      medida_largo: numLargo,
      medida_ancho: numAncho,
    });

    const nuevoItem: ItemCalculoPublico = {
      uid: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      producto_id: productoActual.id,
      nombre: productoActual.nombre,
      tipo: productoActual.tipo,
      unidad_medida: productoActual.unidad_medida,
      cantidad: cantNum,
      medida_largo: numLargo,
      medida_ancho: numAncho,
      medida_largo_calculo: resultado.medidaLargoEfectiva,
      medida_ancho_calculo: resultado.medidaAnchoEfectiva,
      precioUnitario: resultado.precioUnitario,
      subtotal: resultado.subtotal,
    };

    setItems((prev) => [...prev, nuevoItem]);

    // Limpiar formulario para permitir ingresar otro ítem fácilmente
    setProductoSeleccionadoId('');
    setCantidad(1);
    setMedidaLargo('');
    setMedidaAncho('');
    setMensajeValidacion(null);
  };

  const handleEliminarItem = (uid: string) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
  };

  const handleLimpiarTodo = () => {
    setItems([]);
    setMensajeValidacion(null);
  };

  const totalAproximado = items.reduce((acc, it) => acc + it.subtotal, 0);

  return (
    <section
      id="calculadora-precios"
      aria-label="Calculadora pública de precios estimados"
      className="py-16 sm:py-20 bg-[#0d131f] text-gray-100 border-t border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera de la sección */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full inline-block mb-3">
            Herramienta Pública
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Calculadora de Precios <span className="text-cyan-400">Aproximados</span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-400">
            Conoce de forma inmediata un valor referencial para tus cristales, espejos o perfiles.
            Sin registros, sin compromisos y 100% en tu navegador.
          </p>
        </div>

        {/* Estado: Error al cargar productos */}
        {errorCarga && (
          <div
            role="alert"
            className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm text-center max-w-2xl mx-auto"
          >
            <p className="font-semibold mb-1">No se pudieron cargar los productos</p>
            <p className="text-xs text-rose-400/90">{errorCarga}</p>
          </div>
        )}

        {/* Estado: Cargando skeleton */}
        {loading && (
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl p-6 sm:p-8 animate-pulse max-w-5xl mx-auto">
            <div className="h-6 bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="h-12 bg-gray-800 rounded-xl"></div>
              <div className="h-12 bg-gray-800 rounded-xl"></div>
              <div className="h-12 bg-gray-800 rounded-xl"></div>
            </div>
            <div className="h-12 bg-gray-800 rounded-xl w-full"></div>
          </div>
        )}

        {/* Contenido principal cuando los productos están cargados */}
        {!loading && !errorCarga && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto">
            {/* Formulario para agregar productos al cálculo (Col 7 de 12 en Desktop) */}
            <div className="lg:col-span-7 bg-[#161f30] border border-gray-800/90 rounded-2xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800/80">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden="true">📐</span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Configura tu producto
                  </h3>
                </div>
                <span className="text-xs text-gray-400 bg-gray-900/60 px-2.5 py-1 rounded-md border border-gray-800">
                  Paso 1 de 2
                </span>
              </div>

              <form onSubmit={handleAgregarItem} className="space-y-4">
                {/* Selector de Producto */}
                <div>
                  <label htmlFor={selectId} className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Selecciona un producto disponible <span className="text-cyan-400">*</span>
                  </label>
                  <select
                    id={selectId}
                    value={productoSeleccionadoId}
                    onChange={(e) => handleCambiarProducto(e.target.value)}
                    className="w-full h-11 px-3.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-xs sm:text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="" className="bg-[#161f30]">-- Elige un producto --</option>
                    {productos.map((prod) => (
                      <option key={prod.id} value={prod.id} className="bg-[#161f30]">
                        {prod.nombre} {prod.unidad_medida ? `(${prod.unidad_medida})` : ''} - [{prod.tipo}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campos de Medidas Condicionales */}
                {productoActual ? (
                  <div className="space-y-4 pt-1">
                    {/* Explicación de medidas para vidrios/espejos */}
                    {(pideLargo && pideAncho) && (
                      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] sm:text-xs text-cyan-300/90 leading-relaxed">
                        ℹ️ <strong>Cálculo en vidrio/espejo:</strong> Las dimensiones ingresadas se aproximan comercialmente al múltiplo de 10 cm superior más cercano para el corte técnico.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pideLargo && (
                        <div>
                          <label htmlFor={largoId} className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Largo en cm <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            id={largoId}
                            type="number"
                            min="1"
                            step="any"
                            placeholder="Ej. 120"
                            value={medidaLargo}
                            onChange={(e) => {
                              setMedidaLargo(e.target.value);
                              setMensajeValidacion(null);
                            }}
                            className="w-full h-11 px-3.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      {pideAncho && (
                        <div>
                          <label htmlFor={anchoId} className="block text-xs font-semibold text-gray-300 mb-1.5">
                            Ancho en cm <span className="text-cyan-400">*</span>
                          </label>
                          <input
                            id={anchoId}
                            type="number"
                            min="1"
                            step="any"
                            placeholder="Ej. 80"
                            value={medidaAncho}
                            onChange={(e) => {
                              setMedidaAncho(e.target.value);
                              setMensajeValidacion(null);
                            }}
                            className="w-full h-11 px-3.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      <div className={!pideLargo && !pideAncho ? 'sm:col-span-2' : ''}>
                        <label htmlFor={cantidadId} className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Cantidad <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          id={cantidadId}
                          type="number"
                          min="1"
                          max="999"
                          step="1"
                          value={cantidad}
                          onChange={(e) => {
                            const valor = e.target.value;
                            if (valor === '') {
                              setCantidad('');
                            } else {
                              const parsed = parseInt(valor, 10);
                              setCantidad(Number.isNaN(parsed) ? '' : parsed);
                            }
                            setMensajeValidacion(null);
                          }}
                          className="w-full h-11 px-3.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-gray-900/50 border border-gray-800/80 rounded-xl text-xs text-gray-400 text-center">
                    Selecciona un producto para ver las medidas aplicables y su valor aproximado.
                  </div>
                )}

                {/* Mensaje de validación accesible */}
                {mensajeValidacion && (
                  <div
                    role="alert"
                    className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    <span>{mensajeValidacion}</span>
                  </div>
                )}

                {/* Botón de añadir */}
                <button
                  type="submit"
                  disabled={!productoActual}
                  className="w-full h-12 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-cyan-950/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>+ Añadir al cálculo</span>
                </button>
              </form>
            </div>

            {/* Panel de resultados y productos seleccionados (Col 5 de 12 en Desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-[#161f30] border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-xl flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">📋</span>
                      <h3 className="text-base font-bold text-white">
                        Ítems en tu cálculo
                      </h3>
                    </div>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={handleLimpiarTodo}
                        className="text-xs text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Borrar todos los productos del cálculo actual"
                      >
                        Limpiar todo
                      </button>
                    )}
                  </div>

                  {/* Lista de ítems o estado vacío */}
                  {items.length === 0 ? (
                    <div className="py-10 px-4 text-center text-gray-400 bg-gray-900/40 rounded-xl border border-dashed border-gray-800">
                      <span className="text-3xl block mb-2" aria-hidden="true">🛒</span>
                      <p className="text-xs sm:text-sm font-medium text-gray-300 mb-1">
                        Tu cálculo está vacío
                      </p>
                      <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                        Agrega productos en el panel izquierdo para estimar el total aproximado de tu proyecto.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {items.map((it) => (
                        <div
                          key={it.uid}
                          className="bg-gray-900/80 border border-gray-800/80 hover:border-gray-700/80 rounded-xl p-3.5 transition-all text-xs flex flex-col gap-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider block">
                                {it.tipo}
                              </span>
                              <p className="font-semibold text-white text-xs sm:text-sm">
                                {it.nombre}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEliminarItem(it.uid)}
                              aria-label={`Eliminar ${it.nombre} del cálculo`}
                              className="text-gray-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          {/* Medidas aplicables */}
                          {(it.medida_largo || it.medida_ancho) && (
                            <div className="text-[11px] text-gray-400 bg-gray-950/60 p-2 rounded-lg border border-gray-800/60 flex flex-wrap gap-x-3 gap-y-1">
                              {it.medida_largo && (
                                <span>
                                  Largo: <strong className="text-gray-200">{it.medida_largo} cm</strong>
                                  {it.medida_largo_calculo && it.medida_largo_calculo !== it.medida_largo && (
                                    <span className="text-cyan-400/80 ml-1">({it.medida_largo_calculo} cm calc.)</span>
                                  )}
                                </span>
                              )}
                              {it.medida_ancho && (
                                <span>
                                  Ancho: <strong className="text-gray-200">{it.medida_ancho} cm</strong>
                                  {it.medida_ancho_calculo && it.medida_ancho_calculo !== it.medida_ancho && (
                                    <span className="text-cyan-400/80 ml-1">({it.medida_ancho_calculo} cm calc.)</span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Cantidad y Subtotal */}
                          <div className="flex items-center justify-between pt-1 text-xs border-t border-gray-800/60">
                            <span className="text-gray-400">
                              Cant: <strong className="text-white">{it.cantidad}</strong>
                              <span className="text-gray-500 ml-1.5">
                                (~{formatPriceCOP(it.precioUnitario)} c/u)
                              </span>
                            </span>
                            <span className="font-bold text-emerald-400 text-sm">
                              {formatPriceCOP(it.subtotal)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resumen Total y Advertencia */}
                <div className="mt-5 pt-4 border-t border-gray-800/90">
                  <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-4 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider block">
                        Total Estimado
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 tracking-tight">
                        {formatPriceCOP(totalAproximado)}
                      </span>
                    </div>
                    <span className="text-[11px] bg-gray-800 text-gray-300 font-semibold px-2.5 py-1 rounded-md border border-gray-700">
                      COP
                    </span>
                  </div>

                  {/* Mensaje de cálculo aproximado */}
                  <p className="text-[11px] text-gray-400 text-center leading-relaxed">
                    ℹ️ <em>Este cálculo es aproximado y puede variar según las condiciones finales del proyecto, acabados e instalación.</em>
                  </p>

                  {/* Aviso de transporte */}
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-left flex items-start gap-2.5 text-amber-200">
                    <span className="text-base shrink-0 mt-0.5" aria-hidden="true">🚚</span>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      <strong className="text-amber-300 block font-semibold mb-0.5">Transporte no incluido:</strong>
                      Los precios que se dan <strong className="text-amber-200 font-bold">NO tienen incluido el transporte</strong>. Para el servicio de transporte es necesario llamar al{' '}
                      <a href="tel:3137928483" className="text-cyan-400 font-bold hover:underline">3137928483</a>.
                    </p>
                  </div>

                  {/* Acciones complementarias amigables */}
                  <div className="mt-4 pt-3 border-t border-gray-800/60 flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/catalogo"
                      className="flex-1 text-center py-2.5 px-3 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 text-xs font-semibold transition-colors border border-gray-700"
                    >
                      Explorar Catálogo
                    </Link>
                    <Link
                      href="/cotizar"
                      className="flex-1 text-center py-2.5 px-3 rounded-xl bg-cyan-700/30 hover:bg-cyan-600/40 text-cyan-300 text-xs font-semibold transition-colors border border-cyan-500/30"
                    >
                      Crear Cotización Formal
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
