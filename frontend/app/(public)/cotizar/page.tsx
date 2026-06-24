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
    setProductoInicial(params.get('producto'));
  }, []);

  useEffect(() => {
    if (productoInicial) {
      setProductoActual(prev => ({ ...prev, producto_id: productoInicial }));
    }
  }, [productoInicial]);

  const calcularPrecio = (producto: Producto, datos: { cantidad: number, medida_largo?: number, medida_ancho?: number }): number => {
    const precioBase = producto.precio_base;
    if (producto.tipo === 'vidrio' || producto.tipo === 'espejo') {
      const area = (datos.medida_largo && datos.medida_ancho) ? (datos.medida_largo * datos.medida_ancho) / 10000 : 0;
      return precioBase * area * datos.cantidad;
    }
    if (producto.tipo === 'aluminio') {
      const largo = datos.medida_largo || 0;
      return precioBase * (largo / 100) * datos.cantidad;
    }
    return precioBase * datos.cantidad;
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
      showModal(`No puedes pedir más de ${producto.stock} unidades disponibles en stock.`);
      return;
    }

    const precio = calcularPrecio(producto, {
      cantidad: productoActual.cantidad,
      medida_largo: parseFloat(productoActual.medida_largo) || undefined,
      medida_ancho: parseFloat(productoActual.medida_ancho) || undefined
    });

    setItems([...items, {
      producto_id: producto.id,
      nombre: producto.nombre,
      tipo: producto.tipo,
      cantidad: productoActual.cantidad,
      medida_largo: parseFloat(productoActual.medida_largo) || undefined,
      medida_ancho: parseFloat(productoActual.medida_ancho) || undefined,
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

  const actualizarItem = (index: number, campo: string, valor: any) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    if (!item) return;

    (item as any)[campo] = valor;

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
    } catch (error) {
      showModal('Error al conectar con el servidor. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto mt-20 p-8 rounded-3xl shadow-2xl bg-slate-900/90 border border-slate-700">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Cargando tu cotización...</h2>
          <p className="text-center text-slate-400">Un momento mientras preparamos los productos disponibles.</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto mt-20 p-8 rounded-3xl shadow-2xl bg-slate-900/90 border border-slate-700">
          <h2 className="text-3xl font-bold text-white text-center mb-6">Inicia sesión para cotizar</h2>
          <div className="bg-amber-900/30 border border-amber-500 p-6 rounded-3xl text-center">
            <p className="text-lg text-white mb-4">Necesitamos tus datos para crear una cotización personalizada.</p>
            <button
              onClick={() => router.push('/login')}
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl hover:bg-secondary transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-3xl mx-auto mt-20 p-8 rounded-3xl shadow-2xl bg-slate-900/90 border border-slate-700">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">¡Cotización creada!</h2>
            <p className="text-slate-300 mb-6">Tu cotización se ha generado correctamente.</p>
            <div className="inline-flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-500/40 bg-emerald-900/20 px-8 py-6">
              <p className="text-white text-lg">Código de cotización</p>
              <p className="text-5xl font-extrabold text-primary">{resultado.codigo}</p>
            </div>
            <p className="text-slate-400 mt-6">Recuerda llamar al <span className="text-white">3137928483</span> para convertirla en pedido.</p>
            <button
              onClick={() => router.push('/catalogo')}
              className="mt-8 inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl hover:bg-secondary transition-colors"
            >
              Seguir explorando
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 md:pb-10">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-400 mb-3">Cotización rápida</p>
              <h1 className="text-4xl font-bold text-white">Arma tu cotización en minutos</h1>
              <p className="mt-4 text-slate-400 max-w-2xl">Selecciona los productos, completa los datos del cliente y genera tu oferta con facilidad.</p>
            </div>
            <div className="rounded-3xl bg-slate-800 border border-slate-700 p-6 shadow-inner">
              <p className="text-sm text-slate-400">Total estimado</p>
              <p className="mt-3 text-3xl font-bold text-primary">${formatNumber(totales.total)}</p>
              <p className="mt-2 text-sm text-slate-500">Los valores se actualizan según los productos agregados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Datos del cliente */}
            <div className="lg:col-span-1 rounded-3xl bg-slate-950/90 border border-slate-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Datos del cliente</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({...cliente, nombre: e.target.value})}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={cliente.email}
                  onChange={(e) => setCliente({...cliente, email: e.target.value})}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={cliente.telefono}
                  onChange={(e) => setCliente({...cliente, telefono: e.target.value})}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="text"
                  placeholder="Dirección *"
                  value={cliente.direccion}
                  onChange={(e) => setCliente({...cliente, direccion: e.target.value})}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            {/* Agregar productos y lista */}
            <div className="lg:col-span-2 rounded-3xl bg-slate-950/90 border border-slate-800 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Agregar productos</h2>
                  <p className="text-slate-400">Selecciona el producto y completa las medidas necesarias.</p>
                </div>
                <div className="rounded-3xl bg-slate-900/90 border border-slate-700 px-4 py-3 text-sm text-slate-400">
                  Productos añadidos: <span className="text-white font-semibold">{items.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <select
                  value={productoActual.producto_id}
                  onChange={(e) => setProductoActual({...productoActual, producto_id: e.target.value})}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} - Stock: {p.stock}</option>
                  ))}
                </select>
                <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4 text-slate-400">
                  {productoActual.producto_id ? (
                    <p>Seleccionado: <span className="text-white">{productos.find(p => p.id === parseInt(productoActual.producto_id))?.nombre}</span></p>
                  ) : (
                    <p>Selecciona un producto para ver más detalles.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <input
                  type="number"
                  placeholder="Largo (cm)"
                  value={productoActual.medida_largo}
                  onChange={(e) => setProductoActual({...productoActual, medida_largo: e.target.value})}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="number"
                  placeholder="Ancho (cm)"
                  value={productoActual.medida_ancho}
                  onChange={(e) => setProductoActual({...productoActual, medida_ancho: e.target.value})}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <input
                  type="number"
                  placeholder="Cantidad"
                  min="1"
                  max={(() => {
                    const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
                    return producto?.stock || 1;
                  })()}
                  value={productoActual.cantidad}
                  onChange={(e) => setProductoActual({...productoActual, cantidad: Math.min(parseInt(e.target.value) || 1, (() => {
                    const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
                    return producto?.stock || 1;
                  })())})}
                  className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <button
                onClick={agregarItem}
                className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-white font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-cyan-500/30"
              >
                Añadir al presupuesto
              </button>

              {/* Lista de productos agregados con edición */}
              {items.length > 0 && (
                <div className="mt-8 rounded-3xl bg-slate-950/90 border border-slate-800 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Productos seleccionados</h3>
                    <span className="text-sm text-slate-400">{items.length} ítems</span>
                  </div>
                  <div className="space-y-4">
                    {items.map((item, index) => {
                      const mostrarLargo = item.tipo === 'vidrio' || item.tipo === 'espejo' || item.tipo === 'aluminio';
                      const mostrarAncho = item.tipo === 'vidrio' || item.tipo === 'espejo';
                      return (
                        <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900 p-4 flex flex-col gap-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="font-semibold text-white text-lg">{item.nombre}</p>
                            <button
                              onClick={() => eliminarItem(index)}
                              className="rounded-full bg-red-500/10 px-3 py-1 text-red-400 hover:bg-red-500/20 text-sm"
                            >
                              Eliminar
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                            {mostrarLargo && (
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Largo (cm)</label>
                                <input
                                  type="number"
                                  value={item.medida_largo || ''}
                                  onChange={(e) => actualizarItem(index, 'medida_largo', parseFloat(e.target.value) || undefined)}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                              </div>
                            )}
                            {mostrarAncho && (
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">Ancho (cm)</label>
                                <input
                                  type="number"
                                  value={item.medida_ancho || ''}
                                  onChange={(e) => actualizarItem(index, 'medida_ancho', parseFloat(e.target.value) || undefined)}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                />
                              </div>
                            )}
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Cantidad</label>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Precio</label>
                              <p className="text-lg font-bold text-primary">${formatNumber(item.precio)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Botón móvil para generar cotización */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-6 w-full rounded-2xl bg-green-600 px-4 py-4 text-white font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-700 lg:hidden"
                  >
                    {loading ? 'Procesando...' : 'Generar Cotización'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen flotante - visible en desktop y móvil */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 p-4 shadow-2xl lg:bottom-6 lg:left-auto lg:right-6 lg:rounded-3xl lg:border lg:w-80 lg:p-5">
          <div className="flex items-center justify-between lg:block">
            <div className="flex items-center gap-4 lg:block">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400 lg:mb-3">Resumen</p>
              <div className="flex items-center gap-6 lg:block lg:space-y-3">
                <div className="flex items-center gap-2 lg:flex lg:justify-between">
                  <span className="text-slate-400 text-sm">Productos</span>
                  <span className="text-white font-semibold">{items.length}</span>
                </div>
                <div className="flex items-center gap-2 lg:flex lg:justify-between">
                  <span className="text-slate-400 text-sm">Total</span>
                  <span className="text-white font-semibold">${formatNumber(totales.total)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-2xl bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700 transition-colors disabled:bg-slate-700 lg:w-full lg:mt-6"
            >
              {loading ? 'Procesando...' : 'Generar Cotización'}
            </button>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-3xl bg-slate-950 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-3">Atención</h3>
            <p className="text-slate-300 mb-6">{alertMessage || 'Ocurrió un problema, intenta nuevamente.'}</p>
            <button
              onClick={() => setShowAlertModal(false)}
              className="w-full rounded-2xl bg-primary px-5 py-3 text-white font-semibold hover:bg-secondary transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}