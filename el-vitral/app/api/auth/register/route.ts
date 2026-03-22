import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password, telefono, direccion } = await request.json();

    // Verifica si el email ya esta registrado en la db
    const existing = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const result = await query(
      'INSERT INTO usuarios (nombre, email, password, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
      [nombre, email, hashed, telefono, direccion]
    );

    return NextResponse.json({ message: 'Usuario registrado' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}