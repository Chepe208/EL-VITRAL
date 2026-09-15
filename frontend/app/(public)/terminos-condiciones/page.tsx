import Link from 'next/link';

export const metadata = {
  title: 'Términos y condiciones | El Vitral',
  description: 'Términos de uso de los servicios digitales de El Vitral.',
};

export default function TerminosCondicionesPage() {
  return (
    <main className="min-h-screen bg-[#0d131f] px-4 py-12 text-gray-200 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-[#161f30] p-6 shadow-xl sm:p-10">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">← Volver al inicio</Link>
        <h1 className="mt-6 text-3xl font-bold text-white">Términos y condiciones</h1>
        <p className="mt-3 text-sm text-gray-400">Última actualización: 15 de septiembre de 2026.</p>
        <div className="mt-8 space-y-6 text-sm leading-7">
          <section><h2 className="text-xl font-semibold text-white">1. Uso del sitio</h2><p>El usuario se compromete a suministrar información veraz, proteger sus credenciales y usar el sitio de forma lícita. Las cuentas pueden desactivarse cuando exista incumplimiento o por razones de seguridad.</p></section>
          <section><h2 className="text-xl font-semibold text-white">2. Cotizaciones y pedidos</h2><p>Las cotizaciones están sujetas a disponibilidad, medidas, materiales, impuestos y confirmación de El Vitral. Un pedido solo se considera confirmado según la respuesta y condiciones comunicadas al cliente.</p></section>
          <section><h2 className="text-xl font-semibold text-white">3. Pagos</h2><p>Los pagos electrónicos se procesan mediante Stripe. El Vitral no almacena los datos completos de tarjetas. El usuario debe verificar el valor y modalidad antes de confirmar.</p></section>
          <section><h2 className="text-xl font-semibold text-white">4. Contacto y cambios</h2><p>Para soporte, reclamaciones o solicitudes escribe a elvitralsena@gmail.com o llama al +57 313 792 84 83. Estos términos pueden actualizarse; la versión vigente estará publicada en esta página.</p></section>
          <section><h2 className="text-xl font-semibold text-white">5. Información legal</h2><p>Antes del despliegue comercial, el responsable debe completar razón social, NIT, condiciones de garantía, retracto cuando aplique, métodos de atención de PQR y demás información exigida por la actividad económica y la normativa colombiana.</p></section>
        </div>
      </article>
    </main>
  );
}
