'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Validaciones en cliente
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('El correo electrónico es requerido');
      return false;
    }
    // Regex simple para email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Ingresa un correo electrónico válido (ej: usuario@dominio.com)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('La contraseña es requerida');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validar antes de enviar
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (!siteKey) {
      setError('Captcha no está configurado. Define NEXT_PUBLIC_RECAPTCHA_SITE_KEY.');
      return;
    }

    if (!recaptchaToken) {
      setError('Por favor, completa el captcha antes de continuar.');
      return;
    }

    setLoading(true);

    const payload = {
      email: email.trim().toLowerCase(),
      password: password.trim(),
      recaptchaToken,
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Inicio exitoso');
        setTimeout(() => {
          window.location.href = '/'; // Recarga completa y redirige al home
        }, 1200);
      } else {
        // Mostrar mensaje de error del servidor
        setError(data.error || 'Error al iniciar sesión');
        // Resetear captcha para que el usuario tenga que validar nuevamente
        setRecaptchaToken(null);
        // Si el error es de credenciales, podríamos limpiar la contraseña
        if (data.error && data.error.toLowerCase().includes('contraseña')) {
          setPassword('');
          setPasswordError('');
        }
      }
    } catch {
      setError('Error de conexión. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none"></div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-2xl text-white">account_circle</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Bienvenido de vuelta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>


      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 dark:border-gray-700/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-center text-sm">
                <span className="material-symbols-outlined text-base mr-2 align-middle">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-center text-sm">
                <span className="material-symbols-outlined text-base mr-2 align-middle">check_circle</span>
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="material-symbols-outlined text-base mr-2 align-middle">email</span>
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => validateEmail(email)}
                  className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                    ${emailError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="tu@email.com"
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <span className="material-symbols-outlined text-base mr-2 align-middle">lock</span>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  className={`w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200
                    ${passwordError ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="••••••••"
                />
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div></div>
              <div className="text-sm">
                <Link
                  href="/olvide-password"
                  className="font-medium text-primary hover:text-secondary transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="material-symbols-outlined text-base mr-2 align-middle">security</span>
                Verificación de seguridad
              </div>
              {siteKey ? (
                <div className="flex justify-center bg-white rounded-xl p-4 border border-gray-200">
                  <ReCAPTCHA
                    sitekey={siteKey}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 text-yellow-800 dark:text-yellow-400 text-sm">
                  <span className="material-symbols-outlined text-base mr-2 align-middle">warning</span>
                  Captcha no configurado. Añade <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">NEXT_PUBLIC_RECAPTCHA_SITE_KEY</code> en tu archivo de entorno.
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !siteKey}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg text-sm font-semibold text-white
                bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">login</span>
                    Iniciar Sesión
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/registro"
                  className="font-semibold text-primary hover:text-secondary transition-colors duration-200"
                >
                  Regístrate aquí
                </Link>
              </p>

            </div>
          </form>
        </div>
      </div>
    </div>

  );

}