export interface BaseProducto {
  id: number;
  nombre: string;
  tipo: string;
  precio_base: number;
  unidad_medida?: string;
  descripcion?: string;
  imagen_url?: string | null;
  stock?: number;
  grosor?: number;
  activo?: boolean;
}

export interface CalculoInput {
  cantidad: number;
  medida_largo?: number;
  medida_ancho?: number;
}

export interface ResultadoCalculoItem {
  precioUnitario: number;
  subtotal: number;
  medidaLargoEfectiva?: number;
  medidaAnchoEfectiva?: number;
}

export const requiereLargo = (tipo: string): boolean => {
  const t = (tipo || '').toLowerCase();
  return t === 'vidrio' || t === 'espejo' || t === 'aluminio';
};

export const requiereAncho = (tipo: string): boolean => {
  const t = (tipo || '').toLowerCase();
  return t === 'vidrio' || t === 'espejo';
};

export const redondearMedidaVidrio = (medida?: number): number | undefined => {
  if (medida === undefined || isNaN(medida) || medida <= 0) return undefined;
  return Math.ceil(medida / 10) * 10;
};

/**
 * Realiza el cálculo detallado de precio unitario y subtotal para un ítem,
 * respetando las reglas de redondeo para vidrio/espejo y proporcionalidad de aluminio.
 */
export const calcularPrecioItem = (
  producto: BaseProducto,
  datos: CalculoInput
): ResultadoCalculoItem => {
  const cantidad = Math.max(0, Number(datos.cantidad) || 0);
  const precioBase = Number(producto.precio_base) || 0;
  const tipo = (producto.tipo || '').toLowerCase();

  let precioUnitario = precioBase;
  let subtotal = 0;
  let medidaLargoEfectiva = datos.medida_largo;
  let medidaAnchoEfectiva = datos.medida_ancho;

  if (tipo === 'vidrio' || tipo === 'espejo') {
    if (!datos.medida_largo || !datos.medida_ancho) {
      return {
        precioUnitario: 0,
        subtotal: 0,
        medidaLargoEfectiva: undefined,
        medidaAnchoEfectiva: undefined,
      };
    }
    const largoRedondeado = Math.ceil(Number(datos.medida_largo) / 10) * 10;
    const anchoRedondeado = Math.ceil(Number(datos.medida_ancho) / 10) * 10;
    medidaLargoEfectiva = largoRedondeado;
    medidaAnchoEfectiva = anchoRedondeado;
    precioUnitario = (largoRedondeado * anchoRedondeado * precioBase) / 10;
    subtotal = precioUnitario * cantidad;
  } else if (tipo === 'aluminio') {
    const largo = Number(datos.medida_largo) || 0;
    medidaLargoEfectiva = largo;
    precioUnitario = precioBase * (largo / 100);
    subtotal = precioUnitario * cantidad;
  } else {
    // herraje, insumo u otro tipo
    precioUnitario = precioBase;
    subtotal = precioBase * cantidad;
  }

  return {
    precioUnitario: Math.round(precioUnitario * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    medidaLargoEfectiva,
    medidaAnchoEfectiva,
  };
};

/**
 * Función compatible con /cotizar/page.tsx:
 * Retorna el subtotal calculado para el producto y datos dados.
 */
export const calcularPrecio = (
  producto: BaseProducto,
  datos: CalculoInput
): number => {
  return calcularPrecioItem(producto, datos).subtotal;
};

/**
 * Formateo numérico en formato colombiano (ej. 35.000)
 */
export const formatNumberCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formateo de precio con signo de pesos en formato colombiano (ej. $35.000)
 */
export const formatPriceCOP = (value: number): string => {
  return `$${formatNumberCOP(value)}`;
};
