import Link from 'next/link';

export const metadata = {
  title: 'Política de cookies | El Vitral',
  description: 'Información sobre cookies y tecnologías similares usadas por El Vitral.',
};

export default function PoliticaCookiesPage() {
  return (
    <main className="min-h-screen bg-[#0d131f] px-4 py-12 text-gray-200 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-[#161f30] p-6 shadow-xl sm:p-10">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">← Volver al inicio</Link>
        <h1 className="mt-6 text-3xl font-bold text-white">Política de cookies</h1>
        <p className="mt-3 text-sm text-gray-400">Última actualización: 15 de septiembre de 2026.</p>
        <div className="mt-8 space-y-6 text-sm leading-7">
          <section><h2 className="text-xl font-semibold text-white">Cookies necesarias</h2><p>La aplicación usa una cookie de sesión técnica llamada <code>sid</code> para mantener el acceso autenticado. Es necesaria para iniciar sesión, proteger rutas privadas y cerrar la sesión. No se usa para publicidad.</p></section>
          <section><h2 className="text-xl font-semibold text-white">Servicios de terceros</h2><p>Algunas funciones pueden cargar recursos de Google (Maps, reCAPTCHA, OAuth y fuentes), Stripe para pagos y recursos remotos de imágenes. Esos proveedores pueden procesar datos técnicos conforme a sus propias políticas.</p></section>
          <section><h2 className="text-xl font-semibold text-white">Control</h2><p>Las cookies técnicas son necesarias para el funcionamiento del sitio. Puedes bloquear o eliminar cookies desde la configuración del navegador, pero algunas funciones dejarán de estar disponibles. Si se incorporan cookies analíticas o publicitarias, el sitio deberá solicitar el consentimiento correspondiente antes de activarlas.</p></section>
        </div>
      </article>
    </main>
  );
}
