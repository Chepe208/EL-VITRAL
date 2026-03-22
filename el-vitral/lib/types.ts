export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: 'usuario' | 'admin';
  aprobado: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  tipo: 'vidrio' | 'espejo' | 'aluminio' | 'herraje' | 'insumo';
  descripcion?: string;
  imagen_url?: string;
  unidad_medida: string;
  precio_base: number;
  stock_minimo: number;
  activo: boolean;
}

export interface Cotizacion {
  id: number;
  usuario_id?: number;
  nombre_cliente: string;
  email_cliente: string;
  telefono_cliente?: string;
  direccion_cliente?: string;
  fecha_cotizacion: Date;
  subtotal: number;
  iva: number;
  total: number;
  estado: string;
  codigo_unico: string;
}