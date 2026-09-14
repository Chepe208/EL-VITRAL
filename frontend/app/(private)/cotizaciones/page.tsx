'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

interface Cotizacion {
  id: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  fecha_cotizacion: string;
  subtotal: number;
  total: number;
  estado: string;
  codigo_unico: string;
  detalles?: Array<{
    descripcion: string;
    medida_largo?: number;
    medida_ancho?: number;
    cantidad: number;
    subtotal: number;
  }>;
}

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [mobileActionCotizacion, setMobileActionCotizacion] = useState<Cotizacion | null>(null);
  const [mensaje, setMensaje] = useState('');

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch('/api/cotizaciones');
      if (res.ok) {
        const data = await res.json();
        setCotizaciones(data);
      }
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => fetchCotizaciones(), 0);
  }, []);

  const convertirAPedido = async (id?: number) => {
    if (id) {
      // cotización seleccionada
    }
    setShowPhoneModal(true);
  };

  const verDetalles = async (codigo: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${encodeURIComponent(codigo)}`);
      if (!res.ok) {
        setMensaje('No se pudieron cargar los detalles de la cotización');
        return;
      }
      const data = await res.json();
      setSelectedCotizacion(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setMensaje('Error al cargar detalles');
    }
  };

  const descargarPdfCotizacion = (codigo: string) => {
    const url = `/api/cotizaciones/${encodeURIComponent(codigo)}/pdf`;
    window.open(url, '_blank');
  };

  const renderBadgeEstado = (estado: string) => {
    const config: Record<string, string> = {
      vigente: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      aprobada: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      convertida: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    };
    const style = config[estado] || 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${style}`}>
        {estado}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-300 font-medium">Cargando cotizaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Mis Cotizaciones</h1>
            <p className="text-sm text-gray-400 mt-1">Revisa y confirma el estado de tus presupuestos guardados.</p>
          </div>
          <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 w-fit">
            Total: {cotizaciones.length} {cotizaciones.length === 1 ? 'cotización' : 'cotizaciones'}
          </span>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-200">
            {mensaje}
          </div>
        )}

        {cotizaciones.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-12 text-center max-w-md mx-auto shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/80 flex items-center justify-center text-2xl">
              📄
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No tienes cotizaciones</h3>
            <p className="text-gray-400 text-sm mb-6">Aún no has generado ninguna cotización de productos.</p>
            <Link 
              href="/catalogo" 
              className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-xs shadow-lg shadow-cyan-950/50"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cotizaciones.map((cotizacion) => (
              <div 
                key={cotizacion.id}
                className="bg-[#161f30] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Código</span>
                      <h2 className="text-lg font-bold text-white tracking-wide">{cotizacion.codigo_unico}</h2>
                    </div>
                    {renderBadgeEstado(cotizacion.estado)}
                  </div>

                  <div className="space-y-1.5 border-t border-b border-gray-800/80 py-3 my-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cliente:</span>
                      <span className="text-gray-200 font-medium truncate max-w-[150px]">{cotizacion.nombre_cliente}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-gray-200 font-medium">{new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-base font-bold text-emerald-400">${formatNumber(cotizacion.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => verDetalles(cotizacion.codigo_unico)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700 text-center"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => descargarPdfCotizacion(cotizacion.codigo_unico)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 transition-colors border border-cyan-800/50 text-center"
                    >
                      PDF
                    </button>
                  </div>

                  {cotizacion.estado !== 'convertida' && (
                    <button
                      onClick={() => convertirAPedido(cotizacion.id)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-center shadow-md shadow-emerald-950/50"
                    >
                      Confirmar por Llamada
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalles */}
      {showModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Cotización {selectedCotizacion.codigo_unico}</h2>
                <p className="text-xs text-gray-400">Información detallada del presupuesto</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Cliente</span>
                  <span className="text-white font-medium">{selectedCotizacion.nombre_cliente}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Email</span>
                  <span className="text-white font-medium truncate block">{selectedCotizacion.email_cliente}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Teléfono</span>
                  <span className="text-white font-medium">{selectedCotizacion.telefono_cliente || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Fecha</span>
                  <span className="text-white font-medium">{new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Estado</span>
                  {renderBadgeEstado(selectedCotizacion.estado)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Productos</h3>
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-900/80 text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Descripción</th>
                        <th className="p-3">Medidas</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {selectedCotizacion.detalles?.map((det, i: number) => (
                        <tr key={i} className="hover:bg-gray-800/30">
                          <td className="p-3 text-white font-medium">{det.descripcion}</td>
                          <td className="p-3 text-gray-400">
                            {det.medida_largo && det.medida_ancho ? `${det.medida_largo} x ${det.medida_ancho} cm` : 'N/A'}
                          </td>
                          <td className="p-3 text-center text-gray-300">{det.cantidad}</td>
                          <td className="p-3 text-right text-gray-200 font-medium">${formatNumber(Number(det.subtotal))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                <span className="text-xs uppercase font-semibold text-gray-400">Monto Total</span>
                <span className="text-xl font-bold text-emerald-400">${formatNumber(selectedCotizacion.total)}</span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-end gap-3">
              <button
                onClick={() => descargarPdfCotizacion(selectedCotizacion.codigo_unico)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/50 transition-colors"
              >
                Descargar PDF
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Teléfono */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl">
              📞
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Confirmar Cotización</h2>
            <p className="text-gray-400 text-xs mb-5 leading-relaxed">
              Comunícate con nuestro equipo para validar la disponibilidad y procesar la cotización como pedido:
            </p>

            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 mb-5">
              <span className="text-[10px] uppercase font-semibold text-cyan-400 block mb-1">Número de atención</span>
              <span className="text-2xl font-extrabold text-white tracking-wider">3137928483</span>
            </div>

            <p className="text-gray-500 text-[11px] mb-6">Disponibilidad inmediata en horario laboral.</p>

            <button
              onClick={() => setShowPhoneModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* Modal de acciones para móvil */}
      {mobileActionCotizacion && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 md:hidden p-4">
          <div className="rounded-2xl shadow-xl w-full mx-auto" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Acciones</h2>
                  <p className="text-gray-400 text-sm">Cotización {mobileActionCotizacion.codigo_unico}</p>
                </div>
                <button
                  onClick={() => setMobileActionCotizacion(null)}
                  className="text-gray-400 hover:text-gray-200 text-3xl min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    verDetalles(mobileActionCotizacion.codigo_unico);
                    setMobileActionCotizacion(null);
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 text-blue-400 bg-blue-900/30 hover:bg-blue-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-blue-800/50"
                >
                  <span className="material-symbols-outlined">visibility</span>
                  Ver Detalles
                </button>

                <button
                  onClick={() => {
                    descargarPdfCotizacion(mobileActionCotizacion.codigo_unico);
                    setMobileActionCotizacion(null);
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 text-cyan-400 bg-cyan-900/30 hover:bg-cyan-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-cyan-800/50"
                >
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  Descargar PDF
                </button>

                {mobileActionCotizacion.estado !== 'convertida' && (
                  <button
                    onClick={() => {
                      convertirAPedido(mobileActionCotizacion.id);
                      setMobileActionCotizacion(null);
                    }}
                    className="w-full min-h-[48px] flex items-center justify-center gap-2 text-primary bg-sky-900/30 hover:bg-sky-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-sky-800/50"
                  >
                    <span className="material-symbols-outlined">phone_in_talk</span>
                    Llama para confirmar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}