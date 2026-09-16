'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { CredentialResponse } from '@react-oauth/google';

const GoogleAuthButton = dynamic(() => import('@/components/GoogleAuthButton'), {
  ssr: false,
});

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    general: '',
  });
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [aceptaPoliticaDatos, setAceptaPoliticaDatos] = useState(false);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    password: false,
    telefono: false,
    direccion: false,
  });

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setErrors(prev => ({ ...prev, general: '' }));
    setSuccess('');
    if (!aceptaPoliticaDatos || !aceptaTerminos) {
      setErrors(prev => ({ ...prev, general: 'Debes aceptar la política de tratamiento de datos y los términos y condiciones.' }));
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Inicio exitoso con Google. Redirigiendo...');
        setTimeout(() => window.location.href = '/', 1200);
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Error al autenticar' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, general: 'Error de conexión.' }));
    } finally {
      setLoading(false);
    }
  };

  const validateNombre = (value: string) => {
    if (!value.trim()) return 'El nombre es obligatorio';
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return '';
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return 'El correo electrónico es obligatorio';
    if (!emailRegex.test(value.trim())) return 'El correo electrónico no es válido';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return 'La contraseña es obligatoria';
    if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
    if (!/[A-Z]/.test(value)) return 'Debe incluir al menos una mayúscula';
    if (!/[0-9]/.test(value)) return 'Debe incluir al menos un número';
    if (!/[^A-Za-z0-9]/.test(value)) return 'Debe incluir al menos un carácter especial';
    return '';
  };

  const validateTelefono = (value: string) => {
    if (!value.trim()) return '';
    const telefonoRegex = /^(\+?\d{1,3})?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/;
    if (!telefonoRegex.test(value.trim())) return 'Ingresa un número de teléfono válido';
    return '';
  };

  const validateDireccion = (value: string) => {
    if (!value.trim()) return 'La dirección es obligatoria';
    if (value.trim().length < 3) return 'La dirección debe tener al menos 3 caracteres';
    return '';
  };

  const validateAll = () => {
    const nombreErr = validateNombre(formData.nombre);
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    const telefonoErr = validateTelefono(formData.telefono);
    const direccionErr = validateDireccion(formData.direccion);

    setErrors({
      nombre: nombreErr,
      email: emailErr,
      password: passwordErr,
      telefono: telefonoErr,
      direccion: direccionErr,
      general: '',
    });

    return !nombreErr && !emailErr && !passwordErr && !telefonoErr && !direccionErr && aceptaPoliticaDatos && aceptaTerminos;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let value = e.target.value;
    
    if (name === 'email') {
      value = value.toLowerCase();
    } else if (name === 'nombre') {
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toLowerCase();
    }

    setFormData({ ...formData, [name]: value });

    // El email se valida al escribir, mostrando la advertencia de inmediato
    // (igual que en el login), sin esperar a abandonar el campo.
    if (name === 'email' || (touched[name as keyof typeof touched])) {
      let error = '';
      switch (name) {
        case 'nombre': error = validateNombre(value); break;
        case 'email': error = validateEmail(value); break;
        case 'password': error = validatePassword(value); break;
        case 'telefono': error = validateTelefono(value); break;
        case 'direccion': error = validateDireccion(value); break;
      }
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    let error = '';
    switch (name) {
      case 'nombre': error = validateNombre(formData.nombre); break;
      case 'email': error = validateEmail(formData.email); break;
      case 'password': error = validatePassword(formData.password); break;
      case 'telefono': error = validateTelefono(formData.telefono); break;
      case 'direccion': error = validateDireccion(formData.direccion); break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, general: '' }));
    setSuccess('');

    setTouched({
      nombre: true,
      email: true,
      password: true,
      telefono: true,
      direccion: true,
    });

    const isValid = validateAll();
    if (!isValid) {
      if (!aceptaPoliticaDatos || !aceptaTerminos) {
        setErrors(prev => ({
          ...prev,
          general: 'Acepta los términos y el tratamiento de datos para poder registrarte.',
        }));
      } else {
        setErrors(prev => ({ ...prev, general: 'Por favor corrige los errores antes de continuar.' }));
      }
      return;
    }

    setLoading(true);

    const payload = {
      nombre: formData.nombre.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      telefono: formData.telefono.trim(),
      direccion: formData.direccion.trim(),
      aceptaPoliticaDatos,
      aceptaTerminos,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Registro exitoso. Redirigiendo al login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setErrors(prev => ({ ...prev, general: data.error || 'Error al registrarse' }));
        if (data.error && data.error.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: 'Este correo ya está registrado' }));
        }
      }
    } catch {
      setErrors(prev => ({ ...prev, general: 'Error de conexión. Intenta nuevamente.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl border border-cyan-500/20 shadow-lg">
            ✨
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Crear tu cuenta
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Únete a nosotros y comienza tu experiencia
          </p>
        </div>

        <div className="bg-[#161f30] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {errors.general && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-center text-xs">
                ⚠️ {errors.general}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-center text-xs">
                ✓ {success}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-xs font-semibold text-gray-300 mb-1">
                Nombre completo *
              </label>
              <input
                name="nombre"
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                  touched.nombre && errors.nombre ? 'border-rose-500' : 'border-gray-700/80'
                }`}
                placeholder="Tu nombre completo"
              />
              {touched.nombre && errors.nombre && (
                <p className="mt-1 text-xs text-rose-400">{errors.nombre}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-300 mb-1">
                Correo electrónico *
              </label>
              <input
                name="email"
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                  touched.email && errors.email ? 'border-rose-500' : 'border-gray-700/80'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-300 mb-1">
                Contraseña *
              </label>
              <div className="relative">
                <input
                  name="password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                    touched.password && errors.password ? 'border-rose-500' : 'border-gray-700/80'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-cyan-400 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
              )}
              <p className="mt-1 text-[10px] text-gray-500">
                Mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial.
              </p>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="telefono" className="block text-xs font-semibold text-gray-300 mb-1">
                Teléfono <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <input
                name="telefono"
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                  touched.telefono && errors.telefono ? 'border-rose-500' : 'border-gray-700/80'
                }`}
                placeholder="3001234567"
              />
              {touched.telefono && errors.telefono && (
                <p className="mt-1 text-xs text-rose-400">{errors.telefono}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="direccion" className="block text-xs font-semibold text-gray-300 mb-1">
                Dirección *
              </label>
              <input
                name="direccion"
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${
                  touched.direccion && errors.direccion ? 'border-rose-500' : 'border-gray-700/80'
                }`}
                placeholder="Calle 123 # 45-67"
              />
              {touched.direccion && errors.direccion && (
                <p className="mt-1 text-xs text-rose-400">{errors.direccion}</p>
              )}
            </div>

            <div className="space-y-3 rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 text-xs text-gray-300">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={aceptaPoliticaDatos}
                  onChange={(e) => setAceptaPoliticaDatos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-cyan-500"
                />
                <span>
                  Autorizo el tratamiento de mis datos personales conforme a la{' '}
                  <Link href="/politica-privacidad" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline">
                    Política de privacidad y tratamiento de datos
                  </Link>.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={(e) => setAceptaTerminos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-cyan-500"
                />
                <span>
                  Acepto los{' '}
                  <Link href="/terminos-condiciones" target="_blank" className="text-cyan-400 hover:text-cyan-300 underline">
                    términos y condiciones
                  </Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-xs font-semibold text-white transition-all shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col items-center gap-3">
              <span className="text-xs text-gray-500">O continúa con</span>

              {googleClientId ? (
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => setErrors(prev => ({ ...prev, general: 'Error al autenticar con Google' }))}
                />
              ) : (
                <span className="text-xs text-amber-400">Configura Google Auth</span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}