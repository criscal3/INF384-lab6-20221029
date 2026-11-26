// Generic error-handling middleware — never expose parser or internal error details.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'solicitud demasiado grande' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'solicitud inválida' });
  return res.status(500).json({ error: 'error interno del servidor' });
}

module.exports = errorHandler;
