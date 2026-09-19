const { sanitizeString } = require('../../lib/auth.js');

function formatNumericRow(row) {
  if (!row || typeof row !== 'object') return row;
  return Object.keys(row).reduce((acc, key) => {
    const value = row[key];

    if (typeof value === 'bigint') {
      acc[key] = Number(value);
    } else if (typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value)) {
      acc[key] = value.includes('.') ? parseFloat(value) : parseInt(value, 10);
    } else {
      acc[key] = value;
    }

    return acc;
  }, {});
}

function createProjectSlug(value) {
  return sanitizeString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 180);
}

function generateUniqueCode() {
  return `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatPdfDate(value) {
  return new Date(value).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function mapPdfItems(detalles) {
  return (detalles || []).map((item) => ({
    ...item,
    descripcion: item.descripcion || item.producto_nombre || 'Producto',
  }));
}

module.exports = {
  formatNumericRow,
  createProjectSlug,
  generateUniqueCode,
  formatPdfDate,
  mapPdfItems,
};
