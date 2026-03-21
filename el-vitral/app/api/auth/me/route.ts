import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const users = await query('SELECT id, nombre, email, telefono, direccion, rol FROM usuarios WHERE id = ?', [(user as any).id]);
  const userData = (users as any[])[0];
  return NextResponse.json(userData);
}