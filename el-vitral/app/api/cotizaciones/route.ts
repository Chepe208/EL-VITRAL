import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function calcularPrecio(producto: any, datos: any): number {
  const precioBase = producto.precio_base;
  let factor = 1;
  if (producto.tipo === 'vidrio' || producto.tipo === 'espejo') {
    const area = (datos.medida_largo * datos.medida_ancho) / 10000;
    factor = area * (datos.grosor ? datos.grosor / 4 : 1);
  } else if (producto.tipo === 'aluminio') {
    factor = datos.medida_largo / 100;
  }
  return precioBase * factor * datos.cantidad;
}

export async function POST(request: NextRequest) {
  try {
    const { cliente, productos } = await request.json();
    const user = getUserFromRequest(request);

    let subtotal = 0;
    const detalles = [];

    for (const item of productos) {
      const prod = await query('SELECT * FROM productos WHERE id = ?', [item.producto_id]);
      const producto = (prod as any[])[0];
      if (!producto) continue;
      const precio = calcularPrecio(producto, item);
      subtotal += precio;
      detalles.push({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        medida_largo: item.medida_largo,
        medida_ancho: item.medida_ancho,
        grosor: item.grosor,
        precio_unitario: precio / item.cantidad,
        subtotal: precio,
        descripcion: producto.nombre,
      });
    }

    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    const codigo = `COT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await query(
      `INSERT INTO cotizaciones 
       (usuario_id, nombre_cliente, email_cliente, telefono_cliente, direccion_cliente, subtotal, iva, total, codigo_unico)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user ? (user as any).id : null, cliente.nombre, cliente.email, cliente.telefono, cliente.direccion, subtotal, iva, total, codigo]
    );

    const cotizacionId = (result as any).insertId;

    for (const det of detalles) {
      await query(
        `INSERT INTO cotizacion_detalles 
         (cotizacion_id, producto_id, descripcion, cantidad, medida_largo, medida_ancho, grosor, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cotizacionId, det.producto_id, det.descripcion, det.cantidad, det.medida_largo, det.medida_ancho, det.grosor, det.precio_unitario, det.subtotal]
      );
    }

    return NextResponse.json({ message: 'Cotización creada', codigo });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al crear cotización' }, { status: 500 });
  }
}