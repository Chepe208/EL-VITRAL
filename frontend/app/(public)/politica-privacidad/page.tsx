import Link from 'next/link';

export const metadata = {
  title: 'Política de privacidad | El Vitral',
  description: 'Información sobre el tratamiento de datos personales de El Vitral.',
};

export default function PoliticaPrivacidadPage() {
  return (
    <main className="min-h-screen bg-[#0d131f] px-4 py-12 text-gray-200 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl rounded-2xl border border-gray-800 bg-[#161f30] p-6 shadow-xl sm:p-10">
        <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">← Volver al inicio</Link>
        <h1 className="mt-6 text-3xl font-bold text-white">Política de privacidad y tratamiento de datos personales</h1>
        <p className="mt-3 text-sm text-gray-400">Última actualización: 15 de septiembre de 2026.</p>
        <div className="mt-8 space-y-6 text-sm leading-7">
          <section><h2 className="text-xl font-semibold text-white">1. Responsable</h2><p>El responsable de este sitio es El Vitral, con domicilio en Calle 30 # 73-26, Medellín, Antioquia, Colombia. Canales de atención: elvitralsena@gmail.com y +57 313 792 84 83. Antes de publicar, el responsable debe completar aquí su razón social, NIT y demás datos registrales.</p></section>
          <section><h2 className="text-xl font-semibold text-white">2. Datos y finalidades</h2><p>Podemos tratar nombre, correo, teléfono, dirección, solicitudes de cotización, pedidos, citas y datos técnicos necesarios para crear cuentas, prestar servicios, gestionar pagos, responder solicitudes, enviar comunicaciones relacionadas con el servicio y cumplir obligaciones legales.</p></section>
          <section><h2 className="text-xl font-semibold text-white">3. Autorización y derechos</h2><p>El titular puede conocer, actualizar, rectificar, solicitar prueba de la autorización, conocer el uso de sus datos, presentar quejas ante la SIC y solicitar supresión cuando proceda. Las consultas o reclamos pueden enviarse al correo indicado, identificando al titular y describiendo la solicitud. Las respuestas se tramitarán conforme a los plazos legales aplicables.</p></section>
          <section><h2 className="text-xl font-semibold text-white">4. Conservación y terceros</h2><p>Conservaremos la información durante el tiempo necesario para las finalidades informadas y obligaciones legales. Para operar el servicio usamos proveedores como Stripe, Google (reCAPTCHA, OAuth, Maps y fuentes) y servicios de correo. Sus tratamientos y posibles transferencias internacionales deben revisarse y documentarse en los contratos y avisos correspondientes.</p></section>
          <section><h2 className="text-xl font-semibold text-white">5. Seguridad</h2><p>Aplicamos controles razonables de acceso, autenticación y protección de la información. Ningún canal conectado a Internet garantiza riesgo cero; si ocurre un incidente, se tomarán las medidas y notificaciones exigidas por la normativa aplicable.</p></section>
          <section><h2 className="text-xl font-semibold text-white">6. Marco colombiano</h2><p>Esta política se publica como base informativa para el régimen colombiano de protección de datos personales, incluida la Ley 1581 de 2012 y el Decreto 1074 de 2015. Debe ser revisada por el responsable del tratamiento o asesor jurídico antes del despliegue comercial.</p></section>
        </div>
      </article>
    </main>
  );
}
