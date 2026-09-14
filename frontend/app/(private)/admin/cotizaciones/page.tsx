'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatNumber } from '@/lib/format';

interface Cotizacion {
  id: number;
  usuario_id?: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  fecha_cotizacion: string;
  subtotal: number;
  total: number;
  estado: string;
  codigo_unico: string;
}

interface CotizacionDetalle {
  id: number;
  codigo_unico: string;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  direccion_cliente?: string;
  fecha_cotizacion: string;
  total: number;
  estado: string;
  detalles?: Array<{
    descripcion: string;
    medida_largo?: number;
    medida_ancho?: number;
    cantidad: number;
    subtotal: number;
  }>;
}

export default function AdminCotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCotizacion, setSelectedCotizacion] = useState<CotizacionDetalle | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  
  // Mobile actions
  const [mobileActionCotizacion, setMobileActionCotizacion] = useState<Cotizacion | null>(null);

  // Estado para el modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cotizacionToConvert, setCotizacionToConvert] = useState<Cotizacion | CotizacionDetalle | null>(null);

  // Estados para modales de resultado
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const fetchCotizaciones = async () => {
    try {
      const res = await fetch('/api/admin/cotizaciones', {
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        setError(errorData?.error || `Error en la respuesta: ${res.status} ${res.statusText}`);
        setCotizaciones([]);
        return;
      }

      const data = await res.json();
      if (!Array.isArray(data)) {
        setError('Datos de cotizaciones inválidos');
        setCotizaciones([]);
      } else {
        setCotizaciones(data);
      }
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCotizaciones();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const verDetalles = async (codigo: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${codigo}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCotizacion(data);
        setShowModal(true);
      } else {
        setError('Error al cargar los detalles de la cotización');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar los detalles');
    }
  };

  const descargarPdfCotizacion = (id: number) => {
    const url = `/api/admin/cotizaciones/${id}/pdf`;
    window.open(url, '_blank');
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCotizacion(null);
  };

  const convertirAPedido = async (cotizacion: Cotizacion | CotizacionDetalle) => {
    setCotizacionToConvert(cotizacion);
    setShowConfirmModal(true);
  };

  const confirmarConversion = async () => {
    if (!cotizacionToConvert) return;

    setConvertingId(cotizacionToConvert.id);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cotizacion_id: cotizacionToConvert.id,
        })
      });

      if (res.ok) {
        setModalMessage('Cotización convertida a pedido exitosamente');
        setShowSuccessModal(true);
        closeModal();
        fetchCotizaciones();
      } else {
        const error = await res.json();
        setModalMessage(error.error || 'Error al convertir la cotización');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setModalMessage('Error al conectar con el servidor');
      setShowErrorModal(true);
    } finally {
      setConvertingId(null);
      setCotizacionToConvert(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Cotizaciones</h1>
              <p className="text-gray-300 mt-1">Cargando cotizaciones desde la base de datos...</p>
            </div>
            <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver al Panel
          </Link>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="text-white text-xl">Cargando cotizaciones...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#101828'}}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Gestión de Cotizaciones</h1>
            <p className="text-gray-300 mt-1">Se muestran todas las cotizaciones de la base de datos.</p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Volver al Panel
          </Link>
        </div>

        {error ? (
          <div className="rounded-lg bg-red-900/30 border border-red-500 p-6 text-red-200">
            {error}
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="rounded-lg p-10 text-center" style={{ backgroundColor: '#1e2939' }}>
            <p className="text-gray-300 text-lg">No hay cotizaciones registradas</p>
          </div>
        ) : (
          <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: '#1e2939'}}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-700">
                  {cotizaciones.map((cotizacion) => (
                    <tr key={cotizacion.id} className="hover:bg-gray-800/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {cotizacion.codigo_unico}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cotizacion.nombre_cliente}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {cotizacion.email_cliente}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(cotizacion.fecha_cotizacion).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        ${formatNumber(cotizacion.total)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            cotizacion.estado === 'vigente'
                              ? 'bg-green-900/50  text-green-300'
                              : cotizacion.estado === 'aprobada'
                              ? 'bg-blue-900/50  text-blue-300'
                              : cotizacion.estado === 'convertida'
                              ? 'bg-purple-900/50  text-purple-300'
                              : 'bg-red-900/50  text-red-300'
                          }`}
                        >
                          {cotizacion.estado}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="hidden md:block space-x-3">
                          <button
                            onClick={() => descargarPdfCotizacion(cotizacion.id)}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            Exportar PDF
                          </button>
                          <button
                            onClick={() => verDetalles(cotizacion.codigo_unico)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Ver Detalles
                          </button>
                        </div>
                        <div className="md:hidden">
                          <button
                            onClick={() => setMobileActionCotizacion(cotizacion)}
                            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-2 text-white transition-colors border border-gray-600"
                          >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            Acciones
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedCotizacion && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] my-auto overflow-hidden border border-gray-700/50"
            style={{ backgroundColor: '#1e2939' }}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-700 shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Detalle de cotización</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-200 text-2xl p-1 leading-none"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0 space-y-4">
              <div className="space-y-1.5 text-gray-200 text-sm sm:text-base">
                <p><strong>Código:</strong> {selectedCotizacion.codigo_unico}</p>
                <p><strong>Cliente:</strong> {selectedCotizacion.nombre_cliente}</p>
                <p><strong>Email:</strong> {selectedCotizacion.email_cliente}</p>
                <p><strong>Teléfono:</strong> {selectedCotizacion.telefono_cliente}</p>
                <p><strong>Dirección:</strong> {selectedCotizacion.direccion_cliente}</p>
                <p><strong>Fecha:</strong> {new Date(selectedCotizacion.fecha_cotizacion).toLocaleDateString()}</p>
              </div>

              <h3 className="font-bold text-white text-base sm:text-lg pt-2">Productos</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-700/60 max-w-full">
                <table className="w-full text-left min-w-[500px] sm:min-w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="p-2.5 sm:p-3 text-xs font-semibold text-gray-300 uppercase">Producto</th>
                      <th className="p-2.5 sm:p-3 text-xs font-semibold text-gray-300 uppercase">Medidas</th>
                      <th className="p-2.5 sm:p-3 text-xs font-semibold text-gray-300 uppercase">Cantidad</th>
                      <th className="p-2.5 sm:p-3 text-xs font-semibold text-gray-300 uppercase">Precio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {selectedCotizacion.detalles?.map((det: { descripcion: string; medida_largo?: number; medida_ancho?: number; cantidad: number; subtotal: number }, i: number) => (
                      <tr key={i} className="text-gray-200 text-xs sm:text-sm">
                        <td className="p-2.5 sm:p-3 font-medium">{det.descripcion}</td>
                        <td className="p-2.5 sm:p-3">
                          {det.medida_largo && `${det.medida_largo}x${det.medida_ancho} cm`}
                        </td>
                        <td className="p-2.5 sm:p-3">{det.cantidad}</td>
                        <td className="p-2.5 sm:p-3 font-semibold">${formatNumber(det.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-gray-700 shrink-0 bg-[#1e2939] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-left">
                <p className="text-lg sm:text-xl font-bold text-primary">Total: ${formatNumber(selectedCotizacion.total)}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-end items-center">
                <button
                  onClick={() => descargarPdfCotizacion(selectedCotizacion.id)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none text-center"
                >
                  Exportar PDF
                </button>
                {selectedCotizacion.estado !== 'convertida' && (
                  <button
                    onClick={() => convertirAPedido(selectedCotizacion)}
                    disabled={convertingId === selectedCotizacion.id}
                    className="bg-green-600 hover:bg-green-700 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:bg-gray-500 flex-1 sm:flex-none text-center"
                  >
                    {convertingId === selectedCotizacion.id ? 'Convirtiendo...' : 'Convertir a Pedido'}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none text-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && cotizacionToConvert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Confirmar conversión</h2>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setCotizacionToConvert(null);
                  }}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-4">
                <p className="text-gray-300 mb-6">
                  ¿Estás seguro de que quieres convertir la cotización <strong>{cotizacionToConvert.codigo_unico}</strong> de <strong>{cotizacionToConvert.nombre_cliente}</strong> en un pedido?
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setCotizacionToConvert(null);
                    }}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors border border-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarConversion}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors border border-green-500 shadow-lg shadow-green-500/25"
                  >
                    Confirmar Conversión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">¡Éxito!</h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-4">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-300 mb-6">{modalMessage}</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors border border-green-500 shadow-lg shadow-green-500/25"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: '#1e2939' }}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-400">Error</h2>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-400 hover:text-gray-200 text-2xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-4">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-gray-300 mb-6">{modalMessage}</p>
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors border border-red-500 shadow-lg shadow-red-500/25 min-h-[44px]"
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de acciones para móvil */}
      {mobileActionCotizacion && (
        <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-[60] md:hidden p-4">
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
                    descargarPdfCotizacion(mobileActionCotizacion.id);
                    setMobileActionCotizacion(null);
                  }}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 text-cyan-400 bg-cyan-900/30 hover:bg-cyan-900/50 rounded-xl px-4 text-base font-semibold transition-colors border border-cyan-800/50"
                >
                  <span className="material-symbols-outlined">picture_as_pdf</span>
                  Exportar a PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}