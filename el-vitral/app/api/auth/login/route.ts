import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const users = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = (users as any[])[0];
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (user.rol === 'admin' && !user.aprobado) {
      return NextResponse.json({ error: 'Cuenta de administrador pendiente de aprobación' }, { status: 403 });
    }

    const token = generateToken({ id: user.id, email: user.email, rol: user.rol });
    cookies().set('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 7 });

    return NextResponse.json({ message: 'Login exitoso', user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) {
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 });
  }
}