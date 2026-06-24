'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistroPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
  });
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
  const [touched, setTouched] = useState({
    nombre: false,
    email: false,
    password: false,
    telefono: false,
    direccion: false,
  });

  // Validaciones en tiempo real
  const validateNombre = (value: string) => {
    if (!value.trim()) return 'El nombre es obligatorio';
    if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
    return '';
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return 'El correo electrónico es obligatorio';
    if (!emailRegex.test(value.trim())) return 'Ingresa un correo electrónico válido';
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
    if (!value.trim()) return ''; // Opcional
    const telefonoRegex = /^(\+?\d{1,3})?[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/;
    if (!telefonoRegex.test(value.trim())) return 'Ingresa un número de teléfono válido (ej: 3001234567)';
    return '';
  };

  const validateDireccion = (value: string) => {
    if (!value.trim()) return 'La dirección es obligatoria';
    if (value.trim().length < 3) return 'La dirección debe tener al menos 3 caracteres';
    return '';
  };

  // Validar todos los campos y actualizar errores
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

    return !nombreErr && !emailErr && !passwordErr && !telefonoErr && !direccionErr;
  };

  // Manejar cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validar el campo específico si ya fue tocado
    if (touched[name as keyof typeof touched]) {
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

  // Marcar campo como tocado al perder el foco
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    // Validar al salir
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

  // Verificar si el formulario es válido
  const isFormValid = () => {
    const nombreErr = validateNombre(formData.nombre);
    const emailErr = validateEmail(formData.email);
    const passwordErr = validatePassword(formData.password);
    const telefonoErr = validateTelefono(formData.telefono);
    const direccionErr = validateDireccion(formData.direccion);
    return !nombreErr && !emailErr && !passwordErr && !telefonoErr && !direccionErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, general: '' }));
    setSuccess('');

    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      email: true,
      password: true,
      telefono: true,
      direccion: true,
    });

    // Validar todo antes de enviar
    const isValid = validateAll();
    if (!isValid) {
      setErrors(prev => ({ ...prev, general: 'Por favor corrige los errores antes de continuar.' }));
      return;
    }

    setLoading(true);

    const payload = {
      nombre: formData.nombre.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      telefono: formData.telefono.trim(),
      direccion: formData.direccion.trim(),
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
        // Si el servidor devuelve un error específico
        setErrors(prev => ({ ...prev, general: data.error || 'Error al registrarse' }));
        // Si el error es por email ya registrado, resaltar campo
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 pointer-events-none"></div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl text-white">person_add</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Crear tu cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Únete a nosotros y comienza tu experiencia
          </p>
        </div>

        
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 dark:border-gray-700/50">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {/* Mensaje general de error o éxito */}
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                <span className="material-symbols-outlined text-base mr-2 align-middle">error</span>
                {errors.general}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-center text-sm">
                <span className="material-symbols-outlined text-base mr-2 align-middle">check_circle</span>
                {success}
              </div>
            )}

            {/* Campo: Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <span className="material-symbols-outlined text-base mr-1 align-middle">person</span>
                Nombre completo *
              </label>
              <input
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
                  sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                  ${touched.nombre && errors.nombre ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Tu nombre completo"
              />
              {touched.nombre && errors.nombre && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nombre}</p>
              )}
            </div>

            {/* Campo: Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <span className="material-symbols-outlined text-base mr-1 align-middle">email</span>
                Correo electrónico *
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
                  sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                  ${touched.email && errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="tu@email.com"
              />
              {touched.email && errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <span className="material-symbols-outlined text-base mr-1 align-middle">lock</span>
                Contraseña *
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
                  sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                  ${touched.password && errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="••••••••"
              />
              {touched.password && errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Mínimo 6 caracteres, una mayúscula, un número y un carácter especial.
              </div>
            </div>

            {/* Campo: Teléfono (opcional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <span className="material-symbols-outlined text-base mr-1 align-middle">phone</span>
                Teléfono (opcional)
              </label>
              <input
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
                  sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                  ${touched.telefono && errors.telefono ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="3001234567"
              />
              {touched.telefono && errors.telefono && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefono}</p>
              )}
            </div>

            {/* Campo: Dirección */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <span className="material-symbols-outlined text-base mr-1 align-middle">location_on</span>
                Dirección *
              </label>
              <input
                name="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                  placeholder-gray-400 dark:placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500
                  sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                  ${touched.direccion && errors.direccion ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="Calle 123 # 45-67, Ciudad"
              />
              {touched.direccion && errors.direccion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.direccion}</p>
              )}
            </div>

            {/* Botón de envío */}
            <div>
              <button
                type="submit"
                disabled={loading || !isFormValid()}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white
                bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">person_add</span>
                    Crear cuenta
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-green-600 hover:text-emerald-600 transition-colors duration-200"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}