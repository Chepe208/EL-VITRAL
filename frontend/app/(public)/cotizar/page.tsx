'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
  
interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  precio_base: number;
  unidad_medida: string;
  grosor?: number;
  stock: number;
}

interface ItemCotizacion {
  producto_id: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
  grosor?: number;
  precio: number;
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

const MINIMUM_QUOTE_TOTAL_COP = 10000;

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CotizarPage() {
  const router = useRouter();
  const [productoInicial, setProductoInicial] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cliente, setCliente] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [productoActual, setProductoActual] = useState({
    producto_id: '',
    cantidad: 1,
    medida_largo: '',
    medida_ancho: '',
    grosor: ''
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ codigo: string } | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showModal = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(setProductos);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          return res.json();
        } else {
          setIsLoggedIn(false);
          throw new Error('No autenticado');
        }
      })
      .then(data => {
        setIsLoggedIn(true);
        setUsuario(data);
        setCliente({
          nombre: data.nombre || '',
          email: data.email || '',
          telefono: data.telefono || '',
          direccion: data.direccion || ''
        });
      })
      .catch(() => {
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProductoInicial(params.get('producto'));
  }, []);

  useEffect(() => {
    if (productoInicial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProductoActual(prev => ({ ...prev, producto_id: productoInicial }));
    }
  }, [productoInicial]);

  const calcularPrecio = (producto: Producto, datos: { cantidad: number, medida_largo?: number, medida_ancho?: number }): number => {
    const precioBase = producto.precio_base;
    if (producto.tipo === 'vidrio' || producto.tipo === 'espejo') {
      if (!datos.medida_largo || !datos.medida_ancho) return 0;
      const largoRedondeado = Math.ceil(datos.medida_largo / 10) * 10;
      const anchoRedondeado = Math.ceil(datos.medida_ancho / 10) * 10;
      return (largoRedondeado * anchoRedondeado * precioBase) / 10 * datos.cantidad;
    }
    if (producto.tipo === 'aluminio') {
      const largo = datos.medida_largo || 0;
      return precioBase * (largo / 100) * datos.cantidad;
    }
    return precioBase * datos.cantidad;
  };

  const requiereLargo = (tipo: string) => tipo === 'vidrio' || tipo === 'espejo' || tipo === 'aluminio';
  const requiereAncho = (tipo: string) => tipo === 'vidrio' || tipo === 'espejo';

  const cantidadMaxima = (): number => {
    const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
    return producto?.stock ?? 1;
  };

  const cambiarCantidad = (valor: string) => {
    const numero = parseInt(valor) || 1;
    const max = cantidadMaxima();
    if (numero > max) {
      showModal(`La cantidad máxima disponible es ${max}.`);
      setProductoActual({ ...productoActual, cantidad: max });
    } else {
      setProductoActual({ ...productoActual, cantidad: numero });
    }
  };

  const agregarItem = () => {
    if (!productoActual.producto_id) {
      showModal('Selecciona un producto antes de agregar.');
      return;
    }
    const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
    if (!producto) return;

    if ((producto.tipo === 'vidrio' || producto.tipo === 'espejo') &&
        (!productoActual.medida_largo || !productoActual.medida_ancho)) {
      showModal('Para vidrios y espejos debe ingresar largo y ancho.');
      return;
    }

    if (producto.tipo === 'aluminio' && !productoActual.medida_largo) {
      showModal('Para aluminio debe ingresar el largo.');
      return;
    }

    if (productoActual.cantidad > producto.stock) {
      showModal(`La cantidad máxima disponible es ${producto.stock}.`);
      return;
    }

    const precio = calcularPrecio(producto, {
      cantidad: productoActual.cantidad,
      medida_largo: parseFloat(productoActual.medida_largo) || undefined,
      medida_ancho: parseFloat(productoActual.medida_ancho) || undefined
    });

    const medidaLargo = (producto.tipo === 'vidrio' || producto.tipo === 'espejo') && productoActual.medida_largo
      ? Math.ceil(parseFloat(productoActual.medida_largo) / 10) * 10
      : parseFloat(productoActual.medida_largo) || undefined;
    const medidaAncho = (producto.tipo === 'vidrio' || producto.tipo === 'espejo') && productoActual.medida_ancho
      ? Math.ceil(parseFloat(productoActual.medida_ancho) / 10) * 10
      : parseFloat(productoActual.medida_ancho) || undefined;

    setItems([...items, {
      producto_id: producto.id,
      nombre: producto.nombre,
      tipo: producto.tipo,
      cantidad: productoActual.cantidad,
      medida_largo: medidaLargo,
      medida_ancho: medidaAncho,
      precio
    }]);

    setProductoActual({
      producto_id: '',
      cantidad: 1,
      medida_largo: '',
      medida_ancho: '',
      grosor: ''
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actualizarItem = (index: number, campo: string, valor: any) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    if (!item) return;

    if (campo === 'cantidad') {
      const producto = productos.find(p => p.id === item.producto_id);
      const numero = parseInt(valor) || 1;
      const max = producto?.stock ?? 1;
      if (numero > max) {
        showModal(`La cantidad máxima disponible es ${max}.`);
        item.cantidad = max;
      } else {
        item.cantidad = numero;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item as any)[campo] = valor;
    }

    if (item.tipo === 'vidrio' || item.tipo === 'espejo') {
      if (campo === 'medida_largo' && item.medida_largo) {
        item.medida_largo = Math.ceil(Number(item.medida_largo) / 10) * 10;
      }
      if (campo === 'medida_ancho' && item.medida_ancho) {
        item.medida_ancho = Math.ceil(Number(item.medida_ancho) / 10) * 10;
      }
    }

    if (campo === 'cantidad' || campo === 'medida_largo' || campo === 'medida_ancho') {
      const producto = productos.find(p => p.id === item.producto_id);
      if (producto) {
        const nuevoPrecio = calcularPrecio(producto, {
          cantidad: item.cantidad,
          medida_largo: item.medida_largo,
          medida_ancho: item.medida_ancho
        });
        item.precio = nuevoPrecio;
      }
    }

    setItems(nuevosItems);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const total = items.reduce((sum, item) => sum + item.precio, 0);
    return { total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.nombre || !cliente.email || !cliente.telefono || !cliente.direccion) {
      showModal('Por favor completa todos los datos del cliente antes de continuar.');
      return;
    }

    if (items.length === 0) {
      showModal('Debe agregar al menos un producto a la cotización.');
      return;
    }

    if (calcularTotales().total < MINIMUM_QUOTE_TOTAL_COP) {
      showModal('El valor mínimo para una cotización es de $10.000 COP. Agrega productos o ajusta las cantidades para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente,
          productos: items.map(item => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            medida_largo: item.medida_largo,
            medida_ancho: item.medida_ancho
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResultado(data);
      } else {
        showModal(data.error || 'Error al crear cotización.');
      }
    } catch {
      showModal('Error al conectar con el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-300 font-medium">Cargando tu cotización...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161f30] border border-gray-800 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-3xl">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Inicia sesión para cotizar</h2>
          <p className="text-gray-400 text-sm mb-6">Necesitamos tus datos para generar una oferta personalizada de tus productos.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-950/50 text-sm"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-[#0d131f] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161f30] border border-gray-800 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Cotización creada!</h2>
          <p className="text-gray-400 text-xs mb-6">Tu oferta ha sido registrada de manera exitosa en el sistema.</p>
          
        

          <p className="text-gray-400 text-xs mb-6">
            Ponte en contacto al <span className="text-cyan-400 font-semibold">3137928483</span> para procesar tu pedido.
          </p>

          <button
            onClick={() => router.push('/catalogo')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-3 px-6 rounded-xl transition-colors border border-gray-700 text-sm"
          >
            Seguir explorando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-10 px-4 sm:px-6 lg:px-8 pb-32 lg:pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#161f30] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 border-b border-gray-800/80 pb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 block mb-1">Cotización rápida</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Arma tu cotización en minutos</h1>
              <p className="mt-1 text-sm text-gray-400 max-w-xl">Selecciona tus materiales, especifica las medidas y genera una propuesta formal.</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center justify-between lg:justify-end gap-6">
              <div>
                <span className="text-xs text-gray-400 block">Total estimado</span>
                <span className="text-2xl font-bold text-emerald-400">${formatNumber(totales.total)}</span>
              </div>
              <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md border border-gray-700">COP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Datos del cliente */}
            <div className="lg:col-span-1 bg-gray-900/40 border border-gray-800/80 rounded-xl p-5">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span>👤</span> Datos del cliente
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({...cliente, nombre: e.target.value})}
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={cliente.email}
                  onChange={(e) => setCliente({...cliente, email: e.target.value})}
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={cliente.telefono}
                  onChange={(e) => setCliente({...cliente, telefono: e.target.value})}
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Dirección *"
                  value={cliente.direccion}
                  onChange={(e) => setCliente({...cliente, direccion: e.target.value})}
                  className="w-full rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Agregar productos y lista */}
            <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800/80 rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>📐</span> Agregar productos
                </h2>
                <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md border border-gray-700">
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <select
                  value={productoActual.producto_id}
                  onChange={(e) => {
                    const nuevoId = e.target.value;
                    const nuevoProducto = productos.find(p => p.id === parseInt(nuevoId));
                    const nuevoTipo = nuevoProducto?.tipo || '';
                    setProductoActual({
                      ...productoActual,
                      producto_id: nuevoId,
                      medida_largo: requiereLargo(nuevoTipo) ? productoActual.medida_largo : '',
                      medida_ancho: requiereAncho(nuevoTipo) ? productoActual.medida_ancho : '',
                    });
                  }}
                  className="rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock})</option>
                  ))}
                </select>

                <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-2.5 text-xs text-gray-400 flex items-center">
                  {productoActual.producto_id ? (
                    <span className="text-gray-200 truncate">
                      Seleccionado: <strong className="text-white">{productos.find(p => p.id === parseInt(productoActual.producto_id))?.nombre}</strong>
                    </span>
                  ) : (
                    <span>Selecciona un producto para habilitar campos</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {(() => {
                  const productoSeleccionado = productos.find(p => p.id === parseInt(productoActual.producto_id));
                  const tipo = productoSeleccionado?.tipo || '';
                  const showLargo = requiereLargo(tipo);
                  const showAncho = requiereAncho(tipo);
                  const fullWidth = !showLargo && !showAncho;
                  return (
                    <>
                      {showLargo && (
                        <input
                          type="number"
                          placeholder="Largo (cm)"
                          value={productoActual.medida_largo}
                          onChange={(e) => setProductoActual({...productoActual, medida_largo: e.target.value})}
                          className="rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      )}
                      {showAncho && (
                        <input
                          type="number"
                          placeholder="Ancho (cm)"
                          value={productoActual.medida_ancho}
                          onChange={(e) => setProductoActual({...productoActual, medida_ancho: e.target.value})}
                          className="rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      )}
                      <input
                        type="number"
                        placeholder="Cantidad"
                        min="1"
                        value={productoActual.cantidad}
                        onChange={(e) => cambiarCantidad(e.target.value)}
                        className={`rounded-xl border border-gray-700/80 bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none ${fullWidth ? 'col-span-2 lg:col-span-3' : 'lg:col-span-1'}`}
                      />
                    </>
                  );
                })()}
              </div>

              <button
                onClick={agregarItem}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-semibold text-white transition-all shadow-md shadow-cyan-950/50"
              >
                + Añadir a la Cotización
              </button>

              {/* Lista de productos agregados */}
              {items.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-800">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos seleccionados</h3>
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const mostrarLargo = item.tipo === 'vidrio' || item.tipo === 'espejo' || item.tipo === 'aluminio';
                      const mostrarAncho = item.tipo === 'vidrio' || item.tipo === 'espejo';
                      return (
                        <div key={index} className="rounded-xl border border-gray-800 bg-gray-900/90 p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">{item.tipo}</span>
                              <p className="font-bold text-white text-sm">{item.nombre}</p>
                            </div>
                            <button
                              onClick={() => eliminarItem(index)}
                              className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded-md transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                            {mostrarLargo && (
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Largo (cm)</label>
                                <input
                                  type="number"
                                  value={item.medida_largo || ''}
                                  onChange={(e) => actualizarItem(index, 'medida_largo', parseFloat(e.target.value) || undefined)}
                                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                />
                              </div>
                            )}
                            {mostrarAncho && (
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Ancho (cm)</label>
                                <input
                                  type="number"
                                  value={item.medida_ancho || ''}
                                  onChange={(e) => actualizarItem(index, 'medida_ancho', parseFloat(e.target.value) || undefined)}
                                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                />
                              </div>
                            )}
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Cant.</label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Subtotal</label>
                              <p className="text-sm font-bold text-emerald-400 py-1">${formatNumber(item.precio)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-semibold text-white transition-colors disabled:opacity-50 lg:hidden shadow-lg shadow-emerald-950/50"
                  >
                    {loading ? 'Procesando...' : 'Generar Cotización'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen flotante */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#161f30]/95 backdrop-blur-md border-t border-gray-800 p-4 shadow-2xl lg:bottom-6 lg:left-auto lg:right-6 lg:rounded-2xl lg:border lg:w-80 lg:p-5">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-4 lg:block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block lg:mb-2">Resumen</span>
              <div className="flex items-center gap-4 lg:block lg:space-y-2">
                <div className="flex items-center gap-2 lg:justify-between text-xs">
                  <span className="text-gray-400">Productos:</span>
                  <span className="text-white font-semibold">{items.length}</span>
                </div>
                <div className="flex items-center gap-2 lg:justify-between text-xs">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-emerald-400 font-bold text-sm">${formatNumber(totales.total)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 lg:w-full lg:mt-4 shadow-lg shadow-emerald-950/50"
            >
              {loading ? 'Procesando...' : 'Generar Cotización'}
            </button>
          </div>
        </div>
      )}

      {/* Modal de Alertas */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl bg-[#161f30] border border-gray-800 p-6 shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Atención</h3>
            <p className="text-gray-300 text-xs mb-6 leading-relaxed">{alertMessage || 'Ocurrió un problema, intenta nuevamente.'}</p>
            <button
              onClick={() => setShowAlertModal(false)}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}