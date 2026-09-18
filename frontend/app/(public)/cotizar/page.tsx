'use client';
import { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  calcularPrecio,
  calcularPrecioItem,
  requiereLargo,
  requiereAncho,
  formatNumberCOP as formatNumber,
} from '@/lib/calculoPrecios';

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

const MINIMUM_QUOTE_TOTAL_COP = 10000;
const MEDIDA_MAXIMA_CM = 250;

const tipoIconos: Record<string, string> = {
  vidrio: '🪟',
  espejo: '🪞',
  aluminio: '🔩',
  herraje: '🔧',
  insumo: '📦',
};

const esCelularColombia = (telefono: string): boolean => {
  const digitos = telefono.replace(/\D/g, '');
  return digitos.length === 10 ? /^3\d{9}$/.test(digitos) : /^573\d{9}$/.test(digitos);
};

function CotizarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: usuario, loading: userLoading } = useAuth();
  const productoInicial = searchParams.get('producto');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cliente, setCliente] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [items, setItems] = useState<ItemCotizacion[]>([]);
  const [productoActual, setProductoActual] = useState<{
    producto_id: string;
    cantidad: number | '';
    medida_largo: string;
    medida_ancho: string;
    grosor: string;
  }>({
    producto_id: productoInicial || '',
    cantidad: 1,
    medida_largo: '',
    medida_ancho: '',
    grosor: '',
  });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ codigo: string } | null>(null);
  const [clienteUserId, setClienteUserId] = useState<number | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [copiado, setCopiado] = useState(false);

  const showModal = (message: string) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  useEffect(() => {
    fetch('/api/productos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProductos(Array.isArray(data) ? data : []))
      .catch(() => setProductos([]));
  }, []);

  // Prefill datos cliente
  useEffect(() => {
    if (usuario && usuario.id !== clienteUserId) {
      setClienteUserId(usuario.id);
      setCliente({
        nombre: usuario.nombre || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        direccion: usuario.direccion || '',
      });
    }
  }, [usuario, clienteUserId]);

  const productoSeleccionado = useMemo(() => {
    if (!productoActual.producto_id) return null;
    return productos.find((p) => p.id === parseInt(productoActual.producto_id)) || null;
  }, [productos, productoActual.producto_id]);

  const cantidadMaxima = (): number => {
    return productoSeleccionado?.stock ?? 1;
  };

  const cambiarCantidad = (valor: string) => {
    if (valor === '') {
      setProductoActual({ ...productoActual, cantidad: '' });
      return;
    }
    const numero = parseInt(valor, 10);
    if (Number.isNaN(numero) || numero <= 0) {
      setProductoActual({ ...productoActual, cantidad: '' });
      return;
    }
    const max = cantidadMaxima();
    if (numero > max) {
      showModal(`La cantidad máxima disponible en stock es ${max}.`);
      setProductoActual({ ...productoActual, cantidad: max });
    } else {
      setProductoActual({ ...productoActual, cantidad: numero });
    }
  };

  const validarMedida = (valor: string, campo: 'medida_largo' | 'medida_ancho'): boolean => {
    if (valor === '') return false;
    const numero = Number(valor);
    if (Number.isNaN(numero) || numero <= 0) return false;
    if (numero > MEDIDA_MAXIMA_CM) {
      showModal(`La medida ${campo === 'medida_largo' ? 'de largo' : 'de ancho'} no puede exceder los ${MEDIDA_MAXIMA_CM} cm.`);
      return false;
    }
    return true;
  };

  const validaMedidasProducto = (tipo: string, largo: string, ancho: string): boolean => {
    const requiereL = requiereLargo(tipo);
    const requiereA = requiereAncho(tipo);
    if (requiereL && !validarMedida(largo, 'medida_largo')) {
      showModal('Para este producto debes ingresar un largo válido (mayor a 0 y hasta 250 cm).');
      return false;
    }
    if (requiereA && !validarMedida(ancho, 'medida_ancho')) {
      showModal('Para este producto debes ingresar un ancho válido (mayor a 0 y hasta 250 cm).');
      return false;
    }
    return true;
  };

  // Cálculo en vivo del ítem que se está configurando actualmente
  const previewPrecioActual = useMemo(() => {
    if (!productoSeleccionado) return 0;
    const cant = typeof productoActual.cantidad === 'number' ? productoActual.cantidad : 1;
    const largoNum = parseFloat(productoActual.medida_largo) || undefined;
    const anchoNum = parseFloat(productoActual.medida_ancho) || undefined;

    const reqL = requiereLargo(productoSeleccionado.tipo);
    const reqA = requiereAncho(productoSeleccionado.tipo);

    if ((reqL && !largoNum) || (reqA && !anchoNum)) {
      return 0;
    }

    return calcularPrecio(productoSeleccionado, {
      cantidad: cant,
      medida_largo: largoNum,
      medida_ancho: anchoNum,
    });
  }, [productoSeleccionado, productoActual]);

  const agregarItem = () => {
    if (!productoActual.producto_id) {
      showModal('Selecciona un producto antes de agregarlo a la cotización.');
      return;
    }
    if (!productoSeleccionado) return;

    const cantidad = productoActual.cantidad;
    if (cantidad === '' || Number.isNaN(Number(cantidad)) || Number(cantidad) < 1) {
      showModal('Ingresa una cantidad válida (mínimo 1).');
      return;
    }

    if (!validaMedidasProducto(productoSeleccionado.tipo, productoActual.medida_largo, productoActual.medida_ancho)) {
      return;
    }

    if (cantidad > productoSeleccionado.stock) {
      showModal(`La cantidad máxima disponible en stock es ${productoSeleccionado.stock}.`);
      return;
    }

    const precio = calcularPrecio(productoSeleccionado, {
      cantidad,
      medida_largo: parseFloat(productoActual.medida_largo) || undefined,
      medida_ancho: parseFloat(productoActual.medida_ancho) || undefined,
    });

    setItems([
      ...items,
      {
        producto_id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
        tipo: productoSeleccionado.tipo,
        cantidad,
        medida_largo: parseFloat(productoActual.medida_largo) || undefined,
        medida_ancho: parseFloat(productoActual.medida_ancho) || undefined,
        precio,
      },
    ]);

    setProductoActual({
      producto_id: '',
      cantidad: 1,
      medida_largo: '',
      medida_ancho: '',
      grosor: '',
    });
  };

  const actualizarItem = (index: number, campo: string, valor: number | string | undefined) => {
    const nuevosItems = [...items];
    const item = nuevosItems[index];
    if (!item) return;

    if (campo === 'cantidad') {
      const producto = productos.find((p) => p.id === item.producto_id);
      const numero = Number(valor) || 1;
      const max = producto?.stock ?? 1;
      if (numero > max) {
        showModal(`La cantidad máxima disponible es ${max}.`);
        item.cantidad = max;
      } else {
        item.cantidad = numero;
      }
    } else if (campo === 'medida_largo' || campo === 'medida_ancho') {
      const numeroMedida = Number(valor);
      if (!Number.isNaN(numeroMedida) && numeroMedida > MEDIDA_MAXIMA_CM) {
        showModal(`La medida no puede exceder los ${MEDIDA_MAXIMA_CM} cm.`);
        return;
      }
      (item as unknown as Record<string, number | string | undefined>)[campo] = Number.isNaN(numeroMedida) ? undefined : numeroMedida;
    } else {
      (item as unknown as Record<string, number | string | undefined>)[campo] = valor;
    }

    if (campo === 'cantidad' || campo === 'medida_largo' || campo === 'medida_ancho') {
      const producto = productos.find((p) => p.id === item.producto_id);
      if (producto) {
        item.precio = calcularPrecio(producto, {
          cantidad: item.cantidad,
          medida_largo: item.medida_largo,
          medida_ancho: item.medida_ancho,
        });
      }
    }

    setItems(nuevosItems);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totales = useMemo(() => {
    const total = items.reduce((sum, item) => sum + item.precio, 0);
    return { total };
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.nombre || !cliente.email || !cliente.telefono || !cliente.direccion) {
      showModal('Por favor completa todos los datos de contacto del cliente antes de continuar.');
      return;
    }

    if (items.length === 0) {
      showModal('Debes agregar al menos un producto para generar la cotización.');
      return;
    }

    if (cliente.telefono && !esCelularColombia(cliente.telefono)) {
      showModal('Ingresa un número de celular válido en Colombia (ej. 3001234567 o +57 3001234567).');
      return;
    }

    const itemInvalido = items.find((item) => {
      if (item.cantidad < 1) return true;
      const requiere = requiereLargo(item.tipo) || requiereAncho(item.tipo);
      if (!requiere) return false;
      if (requiereLargo(item.tipo) && (!item.medida_largo || item.medida_largo <= 0)) return true;
      if (requiereAncho(item.tipo) && (!item.medida_ancho || item.medida_ancho <= 0)) return true;
      return (
        (item.medida_largo && item.medida_largo > MEDIDA_MAXIMA_CM) ||
        (item.medida_ancho && item.medida_ancho > MEDIDA_MAXIMA_CM)
      );
    });

    if (itemInvalido) {
      showModal(
        `El producto "${itemInvalido.nombre}" tiene medidas o cantidades inválidas. Asegúrate de que las medidas estén entre 1 y ${MEDIDA_MAXIMA_CM} cm.`
      );
      return;
    }

    if (totales.total < MINIMUM_QUOTE_TOTAL_COP) {
      showModal('El valor mínimo para una cotización es de $10.000 COP. Ajusta las medidas o cantidades para continuar.');
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
          productos: items.map((item) => ({
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            medida_largo: item.medida_largo,
            medida_ancho: item.medida_ancho,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResultado(data);
      } else {
        showModal(data.error || 'No fue posible registrar la cotización en este momento.');
      }
    } catch {
      showModal('Ocurrió un error de conexión con el servidor. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = () => {
    if (resultado?.codigo) {
      navigator.clipboard.writeText(resultado.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  // Estado 1: Cargando Auth
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f] text-gray-100">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-300 text-sm font-medium">Verificando sesión...</p>
      </div>
    );
  }

  // Estado 2: Requiere Login
  if (!usuario) {
    return (
      <div className="min-h-screen bg-[#0d131f] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full p-8 sm:p-10 rounded-3xl bg-[#131b2e] border border-gray-800 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Inicia sesión para cotizar</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Para brindarte un presupuesto oficial y guardar tu historial de solicitudes, ingresa con tu cuenta o regístrate en un clic.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-cyan-950/60 text-sm cursor-pointer"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => router.push('/registro')}
              className="w-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 font-semibold py-3 px-6 rounded-xl transition-all border border-gray-700 text-sm cursor-pointer"
            >
              Crear una cuenta nueva
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado 3: Cotización Creada Exitosamente
  if (resultado) {
    return (
      <div className="min-h-screen bg-[#0d131f] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-lg w-full p-8 sm:p-10 rounded-3xl bg-[#131b2e] border border-emerald-500/30 shadow-2xl text-center relative z-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            ¡Cotización Registrada con Éxito!
          </h2>
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            Hemos generado tu propuesta formal. Nuestro equipo técnico revisará los requerimientos para procesar tu orden.
          </p>

          {/* Caja con Código de Cotización */}
          <div className="bg-[#0f1728] border border-gray-700/80 rounded-2xl p-4 mb-6 text-left flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Código Único</span>
              <span className="text-xl font-black text-cyan-400 tracking-wide font-mono">{resultado.codigo}</span>
            </div>
            <button
              onClick={copiarCodigo}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">{copiado ? 'done' : 'content_copy'}</span>
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3.5 mb-4 text-xs text-amber-200 flex items-start gap-2.5 text-left">
            <span className="material-symbols-outlined text-lg shrink-0 text-amber-400 mt-0.5">local_shipping</span>
            <div>
              <strong className="text-amber-300 block mb-0.5">Transporte no incluido</strong>
              <span>Los precios que se dan <strong>NO tienen incluido el transporte</strong>, para el servicio de transporte es necesario llamar al <a href="tel:3137928483" className="text-white font-bold underline">3137928483</a>.</span>
            </div>
          </div>

          <div className="bg-cyan-950/40 border border-cyan-500/20 rounded-xl p-3.5 mb-6 text-xs text-cyan-300 flex items-center gap-2 text-left">
            <span className="material-symbols-outlined text-lg shrink-0">contact_support</span>
            <span>¿Requieres asistencia inmediata? Comunícate al <strong className="text-white font-bold">3137928483</strong>.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/cotizaciones"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-5 rounded-xl transition-all shadow-md shadow-cyan-950/60 text-xs sm:text-sm"
            >
              <span>Ver mis cotizaciones</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <button
              onClick={() => {
                setResultado(null);
                setItems([]);
              }}
              className="inline-flex items-center justify-center gap-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 font-semibold py-3 px-5 rounded-xl transition-all border border-gray-700 text-xs sm:text-sm cursor-pointer"
            >
              <span>Nueva cotización</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado 4: Formulario de Cotización
  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden pb-32 lg:pb-16">
      {/* Resplandor superior */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/5 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Cabecera Principal */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 tracking-wider uppercase bg-cyan-950/70 border border-cyan-500/30 px-3.5 py-1 rounded-full mb-3 shadow-inner">
            <span className="material-symbols-outlined text-sm">calculate</span> Cotizador Digital Oficial
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Configura tu cotización <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">a medida</span>
          </h1>
          <p className="mt-3 text-gray-300 text-sm sm:text-base leading-relaxed">
            Ingresa las medidas requeridas para tus vidrios, espejos o perfiles y genera un presupuesto detallado al instante.
          </p>
        </div>

        {/* Layout de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Formulario (8 de 12) */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Datos del Cliente */}
            <div className="bg-[#131b2e] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Información del Cliente</h2>
                    <p className="text-xs text-gray-400">Datos para asignación y entrega formal de la cotización</p>
                  </div>
                </div>
                {usuario && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Cuenta vinculada
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nombre Completo *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <span className="material-symbols-outlined text-sm">badge</span>
                    </span>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={cliente.nombre}
                      onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Correo Electrónico *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <span className="material-symbols-outlined text-sm">mail</span>
                    </span>
                    <input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      value={cliente.email}
                      onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Celular de Contacto *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <span className="material-symbols-outlined text-sm">phone</span>
                    </span>
                    <input
                      type="tel"
                      placeholder="Ej. 3001234567"
                      value={cliente.telefono}
                      onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Dirección de Instalación *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                    </span>
                    <input
                      type="text"
                      placeholder="Calle 12 # 34-56"
                      value={cliente.direccion}
                      onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                      className="w-full h-11 pl-10 pr-3 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Configurador de Productos */}
            <div className="bg-[#131b2e] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">square_foot</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Configurar Producto & Medidas</h2>
                    <p className="text-xs text-gray-400">Selecciona el cristal o material y define sus dimensiones</p>
                  </div>
                </div>
              </div>

              {/* Selector de Producto */}
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Selecciona el Producto *</label>
                  <div className="relative">
                    <select
                      value={productoActual.producto_id}
                      onChange={(e) => {
                        const nuevoId = e.target.value;
                        const nuevoProducto = productos.find((p) => p.id === parseInt(nuevoId));
                        const nuevoTipo = nuevoProducto?.tipo || '';
                        setProductoActual({
                          ...productoActual,
                          producto_id: nuevoId,
                          medida_largo: requiereLargo(nuevoTipo) ? productoActual.medida_largo : '',
                          medida_ancho: requiereAncho(nuevoTipo) ? productoActual.medida_ancho : '',
                        });
                      }}
                      className="w-full h-12 pl-4 pr-10 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white focus:border-cyan-500 focus:outline-none appearance-none cursor-pointer font-medium"
                    >
                      <option value="" className="bg-[#131b2e]">-- Elige un producto del catálogo --</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id} className="bg-[#131b2e]">
                          {tipoIconos[p.tipo] || '📦'} {p.nombre} ({p.unidad_medida}) — Stock: {p.stock}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-gray-400">
                      <span className="material-symbols-outlined text-lg">unfold_more</span>
                    </div>
                  </div>
                </div>

                {/* Resumen del producto seleccionado */}
                {productoSeleccionado && (
                  <div className="bg-[#101726] border border-cyan-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tipoIconos[productoSeleccionado.tipo] || '📦'}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{productoSeleccionado.nombre}</p>
                        <p className="text-xs text-cyan-400 font-medium capitalize">
                          Categoría: {productoSeleccionado.tipo} · Unidad: {productoSeleccionado.unidad_medida}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-gray-400 block">Stock disponible</span>
                      <span className="text-xs font-bold text-emerald-400">{productoSeleccionado.stock} disponibles</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Campos de Medidas y Cantidad */}
              {productoSeleccionado && (
                <div className="bg-[#0f1726]/60 border border-gray-800/80 rounded-2xl p-5 mb-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {requiereLargo(productoSeleccionado.tipo) && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                          <span>Largo (cm) *</span>
                          <span className="text-[10px] text-gray-500">Máx. 250 cm</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Ej. 180"
                          min="1"
                          max={MEDIDA_MAXIMA_CM}
                          value={productoActual.medida_largo}
                          onChange={(e) => setProductoActual({ ...productoActual, medida_largo: e.target.value })}
                          className="w-full h-11 px-3.5 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {requiereAncho(productoSeleccionado.tipo) && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                          <span>Ancho (cm) *</span>
                          <span className="text-[10px] text-gray-500">Máx. 250 cm</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Ej. 90"
                          min="1"
                          max={MEDIDA_MAXIMA_CM}
                          value={productoActual.medida_ancho}
                          onChange={(e) => setProductoActual({ ...productoActual, medida_ancho: e.target.value })}
                          className="w-full h-11 px-3.5 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                        <span>Cantidad *</span>
                        <span className="text-[10px] text-gray-500">Máx. {productoSeleccionado.stock}</span>
                      </label>
                      <input
                        type="number"
                        placeholder="1"
                        min="1"
                        max={productoSeleccionado.stock}
                        value={productoActual.cantidad}
                        onChange={(e) => cambiarCantidad(e.target.value)}
                        className="w-full h-11 px-3.5 bg-[#17223b] border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Previsualización de precio de este ítem */}
                  {previewPrecioActual > 0 && (
                    <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                      <span className="text-gray-400">Subtotal estimado de este ítem:</span>
                      <span className="text-emerald-400 font-bold text-sm">
                        ${formatNumber(previewPrecioActual)} COP
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Agregar Ítem */}
              <button
                type="button"
                onClick={agregarItem}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] text-white font-bold h-12 rounded-xl transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Añadir Producto a la Lista</span>
              </button>
            </div>

            {/* 3. Lista de Productos Agregados */}
            <div className="bg-[#131b2e] border border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Productos en tu Cotización</h2>
                    <p className="text-xs text-gray-400">Verifica o ajusta las medidas antes de generar el documento</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-[#17223b] text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full">
                  {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-gray-800 rounded-2xl">
                  <span className="material-symbols-outlined text-4xl text-gray-600 mb-2 block">assignment</span>
                  <p className="text-sm font-semibold text-gray-300">Aún no has agregado productos</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Selecciona un producto arriba, especifica sus medidas y haz clic en &ldquo;Añadir Producto&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {items.map((item, index) => {
                    const mostrarLargo = item.tipo === 'vidrio' || item.tipo === 'espejo' || item.tipo === 'aluminio';
                    const mostrarAncho = item.tipo === 'vidrio' || item.tipo === 'espejo';

                    return (
                      <div
                        key={index}
                        className="bg-[#101726] border border-gray-800 hover:border-cyan-500/30 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col gap-3"
                      >
                        {/* Cabecera del ítem */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{tipoIconos[item.tipo] || '📦'}</span>
                            <div>
                              <p className="font-bold text-white text-sm sm:text-base leading-snug">{item.nombre}</p>
                              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                                {item.tipo}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarItem(index)}
                            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            title="Eliminar este producto"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                            <span className="hidden sm:inline">Quitar</span>
                          </button>
                        </div>

                        {/* Controles de medida y cantidad */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-800/80 items-end">
                          {mostrarLargo && (
                            <div>
                              <label className="text-[10px] font-medium text-gray-400 block mb-1">Largo (cm)</label>
                              <input
                                type="number"
                                min="1"
                                max={MEDIDA_MAXIMA_CM}
                                value={item.medida_largo || ''}
                                onChange={(e) =>
                                  actualizarItem(index, 'medida_largo', parseFloat(e.target.value) || undefined)
                                }
                                className="w-full h-9 rounded-lg border border-gray-700/80 bg-[#161f30] px-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                          )}

                          {mostrarAncho && (
                            <div>
                              <label className="text-[10px] font-medium text-gray-400 block mb-1">Ancho (cm)</label>
                              <input
                                type="number"
                                min="1"
                                max={MEDIDA_MAXIMA_CM}
                                value={item.medida_ancho || ''}
                                onChange={(e) =>
                                  actualizarItem(index, 'medida_ancho', parseFloat(e.target.value) || undefined)
                                }
                                className="w-full h-9 rounded-lg border border-gray-700/80 bg-[#161f30] px-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[10px] font-medium text-gray-400 block mb-1">Cantidad</label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                              className="w-full h-9 rounded-lg border border-gray-700/80 bg-[#161f30] px-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                            />
                          </div>

                          <div className="text-right">
                            <label className="text-[10px] font-medium text-gray-400 block mb-1">Subtotal</label>
                            <span className="text-base font-extrabold text-emerald-400">
                              ${formatNumber(item.precio)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen Sticky (4 de 12) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-[#131b2e] border border-cyan-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 blur-[80px] pointer-events-none rounded-full" />

              <h3 className="text-lg font-bold text-white mb-4 pb-3 border-b border-gray-800 flex items-center justify-between">
                <span>Resumen de Cotización</span>
                <span className="material-symbols-outlined text-cyan-400 text-lg">receipt_long</span>
              </h3>

              <div className="space-y-3 text-xs mb-6">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Productos seleccionados:</span>
                  <strong className="text-white">{items.length} {items.length === 1 ? 'ítem' : 'ítems'}</strong>
                </div>

                <div className="flex items-center justify-between text-gray-300">
                  <span>Valor estimado base:</span>
                  <span className="text-white font-medium">${formatNumber(totales.total)} COP</span>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <span>Impuestos:</span>
                  <span>IVA referencial incluido</span>
                </div>

                <div className="flex items-center justify-between text-gray-400">
                  <span>Instalación en obra:</span>
                  <span>A coordinar según proyecto</span>
                </div>

                <div className="flex items-center justify-between text-amber-400/90 font-medium">
                  <span>Transporte:</span>
                  <span className="text-amber-300 font-bold">NO incluido</span>
                </div>

                <div className="pt-4 border-t border-gray-800 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">Total Estimado:</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                      ${formatNumber(totales.total)}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-semibold">COP (Pesos Colombianos)</span>
                  </div>
                </div>
              </div>

              {/* Advertencia de Transporte */}
              <div className="mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-start gap-2.5 text-amber-200">
                <span className="material-symbols-outlined text-amber-400 text-lg shrink-0 mt-0.5">local_shipping</span>
                <div className="text-xs leading-relaxed text-gray-300">
                  <span className="font-bold text-amber-300 block mb-0.5">Aviso importante de transporte</span>
                  <p className="text-[11px]">
                    Los precios que se dan <strong className="text-amber-200">NO tienen incluido el transporte</strong>. Para el servicio de transporte es necesario llamar al{' '}
                    <a href="tel:3137928483" className="font-bold text-cyan-400 hover:text-cyan-300 underline">3137928483</a>.
                  </p>
                </div>
              </div>

              {/* Botón Principal de Envío */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || items.length === 0}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold h-13 rounded-xl transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generando cotización...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">send</span>
                    <span>Generar Cotización Oficial</span>
                  </>
                )}
              </button>

              {/* Sellos de Confianza */}
              <div className="mt-6 pt-5 border-t border-gray-800 space-y-2.5 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-sm">shield</span>
                  <span>Garantía en vidrio templado y herrajes inoxidables</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-sm">support_agent</span>
                  <span>Asesoría personalizada al 3137928483</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-cyan-400 text-sm">assignment_turned_in</span>
                  <span>Validez de oferta: 15 días calendario</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Alertas / Validaciones */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-3xl bg-[#131b2e] border border-amber-500/30 p-6 sm:p-7 shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Información Requerida</h3>
            <p className="text-gray-300 text-xs sm:text-sm mb-6 leading-relaxed">
              {alertMessage || 'Ocurrió una inconsistencia, por favor verifica los datos ingresados.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAlertModal(false)}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-2.5 text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-cyan-950/60 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CotizarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f] text-gray-100">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-300 text-sm font-medium">Cargando cotizador...</p>
        </div>
      }
    >
      <CotizarContent />
    </Suspense>
  );
}