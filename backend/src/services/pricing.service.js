const {
  COP_MINOR_UNIT_MULTIPLIER,
  MINIMUM_QUOTE_TOTAL_COP,
} = require('../config/constants.js');

function toStripeCopAmount(amountInCop) {
  return Math.round(Number(amountInCop) * COP_MINOR_UNIT_MULTIPLIER);
}

function getStripeSecret() {
  const raw = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!raw) return null;
  const clean = raw.split(/[\r\n\\]/)[0].trim().replace(/^["']|["']$/g, '');
  return clean || null;
}

function getPaymentAmountInCop(total, currentPaymentStatus, paymentType) {
  const normalizedTotal = Math.round(Number(total));
  if (!Number.isFinite(normalizedTotal) || normalizedTotal < MINIMUM_QUOTE_TOTAL_COP) {
    return null;
  }

  if (paymentType === 'anticipo') {
    return currentPaymentStatus === 'pendiente' ? Math.round(normalizedTotal / 2) : null;
  }

  if (paymentType === 'pagado') {
    return currentPaymentStatus === 'anticipo'
      ? normalizedTotal - Math.round(normalizedTotal / 2)
      : currentPaymentStatus === 'pendiente'
        ? normalizedTotal
        : null;
  }

  return null;
}

function calculatePrice(product, item) {
  const cantidad = Number(item.cantidad) || 0;
  const medida_largo = Number(item.medida_largo) || 0;
  const medida_ancho = Number(item.medida_ancho) || 0;
  const precioBase = Number(product.precio_base) || 0;
  let precioUnitario = precioBase;
  let subtotal = 0;

  if (['vidrio', 'espejo'].includes(product.tipo)) {
    const largoRedondeado = Math.ceil(medida_largo / 10) * 10;
    const anchoRedondeado = Math.ceil(medida_ancho / 10) * 10;
    precioUnitario = (largoRedondeado * anchoRedondeado * precioBase) / 10;
    subtotal = precioUnitario * cantidad;
  } else if (product.tipo === 'aluminio') {
    subtotal = precioBase * (medida_largo / 100) * cantidad;
    precioUnitario = precioBase * (medida_largo / 100);
  } else {
    subtotal = precioBase * cantidad;
    precioUnitario = precioBase;
  }

  return {
    precioUnitario: Number(precioUnitario.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
  };
}

module.exports = {
  toStripeCopAmount,
  getStripeSecret,
  getPaymentAmountInCop,
  calculatePrice,
};
