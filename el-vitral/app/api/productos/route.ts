import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const productos = await query('SELECT * FROM productos WHERE activo = true');
  return NextResponse.json(productos);
}