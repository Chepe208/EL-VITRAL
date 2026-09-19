const {
  drawHeader,
  drawClientDetails,
  drawItemsTable,
  drawTotals,
  drawFooter,
} = require('../../lib/pdfDesign.js');
const { formatPdfDate, mapPdfItems } = require('../utils/formatters.js');

function buildQuotePdf(doc, cotizacion, detalles) {
  drawHeader(
    doc,
    'Cotización',
    cotizacion.codigo_unico,
    formatPdfDate(cotizacion.fecha_cotizacion),
    cotizacion.estado
  );

  drawClientDetails(doc, cotizacion, [
    { label: 'Código', value: cotizacion.codigo_unico },
    { label: 'Fecha', value: formatPdfDate(cotizacion.fecha_cotizacion) },
  ]);

  drawItemsTable(doc, mapPdfItems(detalles));
  drawTotals(doc, Number(cotizacion.subtotal) || 0, Number(cotizacion.total) || 0);
  drawFooter(doc);
}

function buildPedidoPdf(doc, pedido, detalles) {
  const client = {
    nombre_cliente: pedido.nombre_cliente || 'No especificado',
    email_cliente: pedido.email_cliente || 'No especificado',
    telefono_cliente: pedido.telefono_cliente,
    direccion_cliente: pedido.direccion_cliente,
  };

  drawHeader(
    doc,
    'Pedido',
    `#${pedido.id}`,
    formatPdfDate(pedido.fecha_pedido),
    pedido.estado
  );

  drawClientDetails(doc, client, [
    { label: 'Pedido', value: `#${pedido.id}` },
    { label: 'Entrega', value: pedido.fecha_entrega ? formatPdfDate(pedido.fecha_entrega) : 'Por definir' },
    { label: 'Pago', value: pedido.pago || 'pendiente' },
  ]);

  drawItemsTable(doc, mapPdfItems(detalles));
  drawTotals(doc, Number(pedido.total) || 0, Number(pedido.total) || 0);
  drawFooter(doc);
}

module.exports = {
  buildQuotePdf,
  buildPedidoPdf,
};
