// Generic error-handling middleware for uncontrolled errors.
// Returns a safe response without leaking stack traces or error details.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  res.status(500).json({ error: 'error interno del servidor' });
}

module.exports = errorHandler;
