'use client';
import { useEffect, useState } from 'react';
import { formatNumber } from '@/lib/format';

interface PedidoDetalle {
  id: number;
  cotizacion_id: number;
  producto_id: number;
  descripcion: string;
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
  precio_unitario: number;
  subtotal: number;
  producto_nombre?: string;
  producto_tipo?: string;
}

interface Pedido {
  id: number;
  cotizacion_id?: number;
  fecha_pedido: string;
  fecha_entrega?: string;
  total: number;
  estado: string;
  pago?: string;
  detalles?: PedidoDetalle[];
  encuesta_id?: number | null;
}

export default function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyPedido, setSurveyPedido] = useState<Pedido | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [sendingSurvey, setSendingSurvey] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [payModalPedido, setPayModalPedido] = useState<Pedido | null>(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    fetch('/api/pedidos', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          return [];
        }
        return res.json();
      })
      .then(data => {
        setPedidos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPedidos([]);
        setLoading(false);
      });
  }, []);

  // Detect Stripe redirect back to /mis-pedidos and verify the session
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const success = params.get('checkout_success');
      const cancel = params.get('checkout_cancel');
      const sessionId = params.get('session_id') || params.get('checkout_session_id');
      const pedidoId = params.get('pedido_id');
      const tipoPago = params.get('tipo_pago');

      if ((success === '1' || cancel === '1') && pedidoId) {
        if (success === '1' && sessionId && tipoPago) {
          (async () => {
            try {
              const res = await fetch(`/api/pedidos/${pedidoId}/pago-completado`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ stripe_session_id: sessionId, tipo_pago: tipoPago })
              });

              const data = await res.json().catch(() => null);
              if (res.ok) {
                setPedidos(prev => prev.map(p => p.id === Number(pedidoId)
                  ? { ...p, pago: data?.pago || tipoPago, estado: data?.estado || p.estado }
                  : p));
                setMensaje('');
              } else {
                console.error('Pago verificación fallida', data);
                setMensaje(data?.error || data?.friendly || 'No se pudo verificar el pago.');
              }
            } catch (err) {
              console.error('Error al llamar pago-completado:', err);
              setMensaje('Error al verificar el pago.');
            } finally {
              const url = new URL(window.location.href);
              url.search = '';
              window.history.replaceState({}, '', url.toString());
            }
          })();
        } else {
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, '', url.toString());
          if (cancel === '1') {
            Promise.resolve().then(() => setMensaje('Se canceló el pago.'));
          }
        }
      }
    } catch (e) {
      console.error('Error processing Stripe redirect params', e);
    }
  }, []);

  const verDetallesPedido = async (pedidoId: number) => {
    try {
      const res = await fetch(`/api/pedidos/${pedidoId}`, { credentials: 'include' });
      if (!res.ok) {
        setMensaje('No se pudo cargar el detalle del pedido');
        return;
      }

      const pedido = await res.json();
      setSelectedPedido(pedido);
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar detalle del pedido:', error);
      setMensaje('Error al cargar el detalle del pedido');
    }
  };

  const descargarPdfPedido = (id: number) => {
    const url = `/api/pedidos/${id}/pdf`;
    window.open(url, '_blank');
  };

  const abrirEncuesta = (pedido: Pedido) => {
    setSurveyPedido(pedido);
    setRating(5);
    setComment('');
    setShowSurveyModal(true);
  };

  const enviarEncuesta = async () => {
    if (!surveyPedido) return;

    setMensaje('');
    setSendingSurvey(true);

    try {
      const res = await fetch('/api/encuestas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          pedido_id: surveyPedido.id,
          calificacion: rating,
          comentario: comment,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMensaje(data?.error || 'No se pudo enviar la encuesta');
        return;
      }

      const pedidoEncuestadoId = surveyPedido.id;
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === pedidoEncuestadoId
            ? { ...pedido, encuesta_id: data?.id ?? -1 }
            : pedido
        )
      );

      setShowSurveyModal(false);
      setSurveyPedido(null);
      setShowThankYouModal(true);
    } catch (error) {
      console.error('Error al enviar encuesta:', error);
      setMensaje('Error al enviar la encuesta');
    } finally {
      setSendingSurvey(false);
    }
  };

  const handleStripePayment = (pedido: Pedido, tipo: 'anticipo' | 'pagado') => {
    const total = Number(pedido.total);
    if (!total || total <= 0) return;

    (async () => {
      try {
        const res = await fetch(`/api/pedidos/${pedido.id}/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ tipo_pago: tipo })
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data && data.session) {
          const session = data.session;
          if (session.url) {
            window.location.href = session.url;
            return;
          }
          if (session.id) {
            window.location.href = `${process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin}/?checkout_session_id=${session.id}&pedido_id=${pedido.id}`;
            return;
          }
        }

        const friendly = data?.friendly;
        const detailMsg = data?.error || 'Intenta de nuevo.';
        setMensaje('No se pudo crear la sesión de pago. ' + (friendly || detailMsg));
      } catch (err) {
        console.error('Error creando sesión de Stripe:', err);
        setMensaje('Error conectando con el servidor de pagos.');
      } finally {
        setPayModalPedido(null);
      }
    })();
  };

  const renderBadgeEstado = (estado: string) => {
    const config: Record<string, string> = {
      entregado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      en_proceso: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      pendiente: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
    const style = config[estado] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${style}`}>
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const renderBadgePago = (pago?: string) => {
    const config: Record<string, string> = {
      pagado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      anticipo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    };
    const style = config[pago || ''] || 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${style}`}>
        {pago || 'Pendiente'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d131f]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-300 font-medium">Cargando tus pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Mis Pedidos</h1>
            <p className="text-sm text-gray-400 mt-1">Gestiona tus compras, descargas y estado de entregas.</p>
          </div>
          <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 w-fit">
            Total: {pedidos.length} {pedidos.length === 1 ? 'pedido' : 'pedidos'}
          </span>
        </div>

        {mensaje && (
          <div className="mb-6 rounded-2xl border border-rose-600/30 bg-rose-600/10 p-4 text-sm text-rose-200">
            {mensaje}
          </div>
        )}

        {pedidos.length === 0 ? (
          <div className="rounded-2xl border border-gray-800 bg-[#161f30] p-12 text-center max-w-md mx-auto shadow-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/80 flex items-center justify-center text-2xl">
              📦
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Sin pedidos registrados</h3>
            <p className="text-gray-400 text-sm">Aún no has realizado ninguna compra en la plataforma.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pedidos.map(pedido => (
              <div 
                key={pedido.id} 
                className="bg-[#161f30] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Pedido</span>
                      <h2 className="text-xl font-bold text-white">#{pedido.id}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {renderBadgeEstado(pedido.estado)}
                      {renderBadgePago(pedido.pago)}
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-b border-gray-800/80 py-3 my-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fecha:</span>
                      <span className="text-gray-200 font-medium">{new Date(pedido.fecha_pedido).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-lg font-bold text-emerald-400">${formatNumber(pedido.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => verDetallesPedido(pedido.id)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700 text-center"
                    >
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => descargarPdfPedido(pedido.id)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-400 transition-colors border border-cyan-800/50 text-center"
                    >
                      PDF
                    </button>
                  </div>

                  {pedido.pago !== 'pagado' && (
                    <button
                      onClick={() => setPayModalPedido(pedido)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors text-center shadow-md shadow-emerald-950/50"
                    >
                      Pagar
                    </button>
                  )}

                  {pedido.estado === 'entregado' && !pedido.encuesta_id && (
                    <button
                      onClick={() => abrirEncuesta(pedido)}
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors text-center"
                    >
                      Responder Encuesta
                    </button>
                  )}

                  {pedido.estado === 'entregado' && pedido.encuesta_id && (
                    <span className="text-center text-xs text-gray-500 py-1">
                      ✓ Encuesta completada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {showModal && selectedPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Detalle del Pedido #{selectedPedido.id}</h2>
                <p className="text-xs text-gray-400">Información detallada de la compra</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/50 p-4 rounded-xl border border-gray-800 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Fecha Pedido</span>
                  <span className="text-white font-medium">{new Date(selectedPedido.fecha_pedido).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Entrega Est.</span>
                  <span className="text-white font-medium">
                    {selectedPedido.fecha_entrega ? new Date(selectedPedido.fecha_entrega).toLocaleDateString() : 'Por definir'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Estado</span>
                  {renderBadgeEstado(selectedPedido.estado)}
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Monto Total</span>
                  <span className="text-emerald-400 font-bold">${formatNumber(Number(selectedPedido.total))}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Productos</h3>
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-900/80 text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">Producto</th>
                        <th className="p-3">Medidas</th>
                        <th className="p-3 text-center">Cant.</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(selectedPedido.detalles || []).map((det, i) => (
                        <tr key={i} className="hover:bg-gray-800/30">
                          <td className="p-3 text-white font-medium">{det.producto_nombre || det.descripcion}</td>
                          <td className="p-3 text-gray-400">
                            {det.medida_largo && det.medida_ancho ? `${det.medida_largo} x ${det.medida_ancho} cm` : 'N/A'}
                          </td>
                          <td className="p-3 text-center text-gray-300">{det.cantidad}</td>
                          <td className="p-3 text-right text-gray-200 font-medium">${formatNumber(det.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/40 flex justify-end gap-3">
              <button
                onClick={() => descargarPdfPedido(selectedPedido.id)}
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

      {/* Modal de encuesta */}
      {showSurveyModal && surveyPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Encuesta de Satisfacción</h2>
              <button onClick={() => setShowSurveyModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-gray-400 text-xs mb-5">
              ¿Cómo evaluarías la atención y entrega para el pedido <strong className="text-white">#{surveyPedido.id}</strong>?
            </p>

            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Calificación
            </label>

            <div className="flex gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all ${
                    rating >= value
                      ? 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {value} ★
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Comentario u Observaciones
            </label>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60 text-white p-3 text-sm focus:outline-none focus:border-cyan-500 mb-6 placeholder-gray-500"
              placeholder="Escribe tus observaciones del pedido..."
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSurveyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={enviarEncuesta}
                disabled={sendingSurvey}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors shadow-lg shadow-emerald-950/50"
              >
                {sendingSurvey ? 'Enviando...' : 'Enviar Encuesta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agradecimiento */}
      {showThankYouModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-white mb-1">¡Encuesta guardada!</h3>
            <p className="text-gray-400 text-xs mb-6">Gracias por tus comentarios. Tus sugerencias nos ayudan a seguir mejorando.</p>
            <button
              onClick={() => setShowThankYouModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {payModalPedido && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161f30] border border-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Pago del Pedido #{payModalPedido.id}</h3>
              <button onClick={() => setPayModalPedido(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Elige el método de pago para completar la transacción del pedido.
            </p>

            <div className="flex flex-col gap-3">
              {payModalPedido.pago !== 'anticipo' && (
                <button
                  onClick={() => handleStripePayment(payModalPedido, 'anticipo')}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex justify-between items-center shadow-lg shadow-indigo-950/50"
                >
                  <span>Pagar Anticipo (50%)</span>
                  <span>${formatNumber(Number(payModalPedido.total) / 2)}</span>
                </button>
              )}
              <button
                onClick={() => handleStripePayment(payModalPedido, 'pagado')}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex justify-between items-center shadow-lg shadow-emerald-950/50"
              >
                <span>{payModalPedido.pago === 'anticipo' ? 'Pagar Saldo Pendiente' : 'Pagar Total (100%)'}</span>
                <span>
                  ${formatNumber(
                    payModalPedido.pago === 'anticipo'
                      ? Number(payModalPedido.total) - Math.round(Number(payModalPedido.total) / 2)
                      : Number(payModalPedido.total)
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}