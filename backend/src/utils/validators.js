const dns = require('dns');
const { MINUTO_INICIO_JORNADA, MINUTO_FIN_JORNADA } = require('../config/constants.js');

function validarHorarioCita(fecha) {
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) {
    return 'Las citas solo se pueden agendar de lunes a viernes.';
  }
  const totalMinutos = fecha.getHours() * 60 + fecha.getMinutes();
  if (totalMinutos < MINUTO_INICIO_JORNADA || totalMinutos > MINUTO_FIN_JORNADA) {
    return 'Las citas solo se pueden agendar entre las 8:00 a. m. y las 5:00 p. m.';
  }
  return null;
}

function toFechaLocalDateKey(fecha) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

async function validarDominioEmail(email) {
  const domain = String(email || '').split('@')[1];
  if (!domain) {
    return 'El formato del correo no es válido';
  }
  try {
    const mxRecords = await dns.promises.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return 'El dominio del correo no es válido (no recibe correos)';
    }
  } catch (err) {
    return 'El dominio del correo no existe o no es válido';
  }
  return null;
}

function esCelularColombia(phone) {
  const digitos = String(phone || '').replace(/\D/g, '');
  return digitos.length === 10 ? /^3\d{9}$/.test(digitos) : /^573\d{9}$/.test(digitos);
}

module.exports = {
  validarHorarioCita,
  toFechaLocalDateKey,
  validarDominioEmail,
  esCelularColombia,
};
