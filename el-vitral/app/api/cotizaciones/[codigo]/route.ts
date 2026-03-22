import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  const cotizaciones = await query('SELECT * FROM cotizaciones WHERE codigo_unico = ?', [params.codigo]);
  const cotizacion = (cotizaciones as any[])[0];
  if (!cotizacion) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  }
  const detalles = await query('SELECT * FROM cotizacion_detalles WHERE cotizacion_id = ?', [cotizacion.id]);
  return NextResponse.json({ ...cotizacion, detalles });
}