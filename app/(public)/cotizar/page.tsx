'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/components/NavBar';

interface Producto {
  id: number;
  nombre: string;
  tipo: string;
  precio_base: number;
  unidad_medida: string;
  grosor?: number;
}

interface ItemCotizacion {
  producto_id: number;
  nombre: string;
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
  grosor?: number;
  precio: number;
}

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CotizarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productoInicial = searchParams.get('producto');

  const [productos, setProductos] = useState<Producto[]>([]);
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

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(setProductos);
  }, []);

  useEffect(() => {
    if (productoInicial) {
      setProductoActual(prev => ({ ...prev, producto_id: productoInicial }));
    }
  }, [productoInicial]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  const calcularPrecio = (producto: Producto, datos: any): number => {
    const precioBase = producto.precio_base;
    if (producto.tipo === 'vidrio' || producto.tipo === 'espejo') {
      const area = (parseFloat(datos.medida_largo) * parseFloat(datos.medida_ancho)) / 10000; // Convertir cm² a m²
      return precioBase * area * datos.cantidad;
    }
    if (producto.tipo === 'aluminio') {
      return precioBase * (parseFloat(datos.medida_largo) / 100) * datos.cantidad; // precio por metro lineal
    }
    return precioBase * datos.cantidad;
  };

  const agregarItem = () => {
    if (!productoActual.producto_id) return;
    const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
    if (!producto) return;

    if ((producto.tipo === 'vidrio' || producto.tipo === 'espejo') && 
        (!productoActual.medida_largo || !productoActual.medida_ancho)) {
      alert('Para vidrios y espejos debe ingresar largo y ancho');
      return;
    }

    if (producto.tipo === 'aluminio' && !productoActual.medida_largo) {
      alert('Para aluminio debe ingresar el largo');
      return;
    }

    const precio = calcularPrecio(producto, {
      ...productoActual,
      cantidad: productoActual.cantidad
    });

    setItems([...items, {
      producto_id: producto.id,
      nombre: producto.nombre,
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

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calcularTotales = () => {
    const total = items.reduce((sum, item) => sum + item.precio, 0);
    return { total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cotizaciones', {
        method: 'POST',
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
        alert(data.error || 'Error al crear cotización');
      }
    } catch (error) {
      alert('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const totales = calcularTotales();

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
          <h2 className="text-3xl font-bold text-white text-center mb-6">Cargando...</h2>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
          <h2 className="text-3xl font-bold text-white text-center mb-6">Cotización</h2>
          <div className="bg-yellow-900/30 border border-yellow-500 p-6 rounded-md text-center">
            <p className="text-xl text-white mb-4">Debe iniciar sesión para poder hacer la cotización.</p>
            <button onClick={() => router.push('/login')} className="bg-primary text-blue-400 py-2 px-4 rounded-md hover:bg-secondary transition-colors">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <NavBar />
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md" style={{ backgroundColor: '#1e2939'}}>
          <h2 className="text-3xl font-bold text-white text-center mb-6">¡Cotización creada!</h2>
          <div className="bg-green-900/30 border border-green-500 p-6 rounded-md text-center">
            <p className="text-xl text-white mb-4">Tu código de cotización es:</p>
            <p className="text-4xl font-mono font-bold text-primary">{resultado.codigo}</p>
            <p className="text-gray-300 mt-4">Guarda este código para consultar tu cotización más tarde.</p>
          </div>
          <button
            onClick={() => router.push('/catalogo')}
            className="mt-6 w-full bg-primary text-blue-400 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            Seguir explorando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Cotización en Línea</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Datos del cliente */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1e2939'}}>
              <h2 className="text-xl font-bold text-white mb-4">Tus datos</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nombre completo *"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({...cliente, nombre: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={cliente.email}
                  onChange={(e) => setCliente({...cliente, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                />
                <input
                  type="tel"
                  placeholder="Teléfono *"
                  value={cliente.telefono}
                  onChange={(e) => setCliente({...cliente, telefono: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Dirección *"
                  value={cliente.direccion}
                  onChange={(e) => setCliente({...cliente, direccion: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Agregar productos */}
          <div className="lg:col-span-2">
            <div className="rounded-lg shadow-md p-6" style={{ backgroundColor: '#1e2939'}}>
              <h2 className="text-xl font-bold text-white mb-4">Agregar productos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={productoActual.producto_id}
                  onChange={(e) => setProductoActual({...productoActual, producto_id: e.target.value})}
                  className="px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white"
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>

                {productoActual.producto_id && (
                  <>
                    <input
                      type="number"
                      placeholder="Largo (cm)"
                      value={productoActual.medida_largo}
                      onChange={(e) => setProductoActual({...productoActual, medida_largo: e.target.value})}
                      className="px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                    />
                    {(() => {
                      const producto = productos.find(p => p.id === parseInt(productoActual.producto_id));
                      return (producto?.tipo === 'vidrio' || producto?.tipo === 'espejo') ? (
                        <input
                          type="number"
                          placeholder="Ancho (cm)"
                          value={productoActual.medida_ancho}
                          onChange={(e) => setProductoActual({...productoActual, medida_ancho: e.target.value})}
                          className="px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400" 
                        />
                      ) : null;
                    })()}
                    <input
                      type="number"
                      placeholder="Cantidad"
                      min="1"
                      value={productoActual.cantidad}
                      onChange={(e) => setProductoActual({...productoActual, cantidad: parseInt(e.target.value)})}
                      className="px-4 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-gray-800 text-white placeholder-gray-400"
                    />
                  </>
                )}
              </div>

              <button
                onClick={agregarItem}
                className="mt-4 bg-primary text-blue-400 px-6 py-2 rounded-md hover:bg-secondary transition-colors"
              >
                Agregar Producto
              </button>

              {}
              {items.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-bold text-white mb-4">Productos Seleccionados</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: '#0f172a'}}>
                        <div>
                          <p className="font-medium text-white">{item.nombre}</p>
                          <p className="text-sm text-gray-300">
                            {item.medida_largo && `${item.medida_largo}x${item.medida_ancho} cm `}
                            x {item.cantidad} und
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary">${formatNumber(item.precio)}</span>
                          <button
                            onClick={() => eliminarItem(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totales */}
                  <div className="mt-6 p-4 rounded-md" style={{ backgroundColor:'#0f172a' }}>
                    <div className="flex justify-between text-lg">
                      <span className='text-white'>Total:</span>
                      <span className="font-bold text-primary">${formatNumber(totales.total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-4 w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500"
                  >
                    {loading ? 'Procesando...' : 'Generar Cotización'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}