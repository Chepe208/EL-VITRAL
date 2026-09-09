'use client';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type ReCAPTCHAComponent from 'react-google-recaptcha';
import type { CredentialResponse } from '@react-oauth/google';

const ReCAPTCHA = dynamic(() => import('@/components/CaptchaWidget'), {
  ssr: false,
  loading: () => <div className="h-16 w-full flex items-center justify-center text-xs text-gray-500">Cargando verificación...</div>,
});

const GoogleAuthButton = dynamic(() => import('@/components/GoogleAuthButton'), {
  ssr: false,
});

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 360);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const recaptchaRef = useRef<ReCAPTCHAComponent>(null);

  const resetRecaptcha = () => {
    recaptchaRef.current?.reset();
    setRecaptchaToken(null);
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Inicio exitoso con Google');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setError(data.error || 'Error al iniciar sesión con Google');
      }
    } catch {
      setError('Error de conexión. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('El correo electrónico es requerido');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Ingresa un correo electrónico válido');
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
          window.location.href = '/';
        }, 1200);
      } else {
        setError(data.error || 'Error al iniciar sesión');
        resetRecaptcha();
        if (data.error && data.error.toLowerCase().includes('contraseña')) {
          setPassword('');
          setPasswordError('');
        }
      }
    } catch {
      setError('Error de conexión. Verifica tu conexión a internet.');
      resetRecaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d131f] text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-3xl border border-cyan-500/20 shadow-lg">
            👤
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Bienvenido de vuelta
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Inicia sesión en tu cuenta para continuar
          </p>
        </div>

        <div className="bg-[#161f30] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl text-center text-xs">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-center text-xs">
                ✓ {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${emailError ? 'border-rose-500' : 'border-gray-700/80'
                  }`}
                placeholder="tu@email.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-rose-400">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => validatePassword(password)}
                  className={`w-full rounded-xl border bg-gray-900/80 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors ${passwordError ? 'border-rose-500' : 'border-gray-700/80'
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
              {passwordError && (
                <p className="mt-1 text-xs text-rose-400">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/olvide-password"
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-semibold text-gray-400">
                Verificación de seguridad
              </span>
              {siteKey ? (
                <div className="flex justify-center bg-gray-900/90 rounded-xl p-3 border border-gray-800">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    key={isSmallScreen ? 'compact' : 'normal'}
                    sitekey={siteKey}
                    size={isSmallScreen ? 'compact' : 'normal'}
                    onChange={(token) => setRecaptchaToken(token)}
                    onExpired={resetRecaptcha}
                    onErrored={() => {
                      resetRecaptcha();
                      setError('No fue posible validar el captcha. Inténtalo nuevamente.');
                    }}
                    theme="dark"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 text-xs">
                  ⚠️ Captcha no configurado.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !siteKey}
              className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-xs font-semibold text-white transition-all shadow-lg shadow-cyan-950/50 disabled:opacity-50"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/registro"
                  className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800 flex flex-col items-center gap-4">
              <span className="text-xs text-gray-500">O continúa con</span>

              {googleClientId ? (
                <GoogleAuthButton
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Error al autenticar con Google')}
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
