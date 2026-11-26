const PATRON_CODIGO = /^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$/;
const MAX_APROBADOS = 87;

function validarAprobados(body) {
  const aprobados = body?.aprobados;
  if (!Array.isArray(aprobados)) return { status: 400, body: { error: 'solicitud inválida' } };
  if (!aprobados.every(elemento => typeof elemento === 'string')) return { status: 400, body: { error: 'solicitud inválida' } };
  if (aprobados.length > MAX_APROBADOS) return { status: 413, body: { error: 'solicitud demasiado grande' } };
  for (const codigo of aprobados) {
    if (codigo.includes('\n') || !PATRON_CODIGO.test(codigo)) return { status: 400, body: { error: 'solicitud inválida' } };
  }
  return null;
}

module.exports = { PATRON_CODIGO, MAX_APROBADOS, validarAprobados };
