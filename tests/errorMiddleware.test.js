const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errors');

// Build a minimal app that exercises the shared error-handling middleware.
function buildBrokenApp() {
  const app = express();

  app.get('/error-route', (_req, _res, next) => {
    next(new Error('fallo inesperado'));
  });

  app.use(errorHandler);

  return app;
}

describe('middleware de manejo de errores', () => {
  test('devuelve 500 con mensaje genérico ante un error no controlado', async () => {
    const res = await request(buildBrokenApp()).get('/error-route');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'error interno del servidor' });
  });

  test('no expone stack traces ni detalles del error', async () => {
    const res = await request(buildBrokenApp()).get('/error-route');
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('stack');
    expect(body).not.toContain('fallo inesperado');
  });
});
