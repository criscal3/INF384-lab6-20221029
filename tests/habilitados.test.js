const request = require('supertest');
const express = require('express');
const app = require('../src/app');
const repositorio = require('../src/data/repositorio');

function sinFuga(body) {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('stack');
  expect(serialized).not.toContain('C:');
  expect(serialized).not.toContain('\\');
  expect(serialized).not.toContain('src/');
}

describe('POST /habilitados', () => {
  // Requisito: RF-1.1
  test('rf1.1 devuelve los 27 cursos del caso base', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: ['1INF25', '1INF27', '1INF49'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(27);
    expect(res.body.map(curso => curso.id)).toEqual(expect.arrayContaining(['1INF29', '1INF30', '1INF31', '1INF32']));
  });

  // Requisito: RF-2.1
  test('rf2.1 incluye curso no aprobado con todos sus prerequisitos aprobados', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: ['1INF25'] });
    expect(res.status).toBe(200);
    expect(res.body.map(curso => curso.id)).toContain('1INF29');
  });

  // Requisito: RF-2.2
  test('rf2.2 incluye cursos sin prerequisitos', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: [] });
    expect(res.status).toBe(200);
    expect(res.body.every(curso => curso.prerequisites.length === 0)).toBe(true);
  });

  // Requisito: RF-2.3
  test('rf2.3 excluye curso con al menos un prerequisito faltante', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: ['1INF25'] });
    expect(res.status).toBe(200);
    expect(res.body.map(curso => curso.id)).not.toContain('1INF32');
  });

  // Requisito: RF-2.4
  test('rf2.4 excluye cursos aprobados', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: ['1INF25', '1INF27'] });
    expect(res.status).toBe(200);
    expect(res.body.map(curso => curso.id)).not.toContain('1INF25');
  });

  // Requisito: RS-1.1
  test('rs1.1 rechaza body mayor a 2 KB', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: Array(300).fill('INF238') });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'solicitud demasiado grande' });
    sinFuga(res.body);
  });

  // Requisito: RS-1.2
  test('rs1.2 rechaza mas de 87 elementos antes de deduplicar', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: Array(88).fill('INF238') });
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'solicitud demasiado grande' });
    sinFuga(res.body);

    const duplicated = await request(app).post('/habilitados').send({ aprobados: Array(88).fill('1INF25') });
    expect(duplicated.status).toBe(413);
    expect(duplicated.body).toEqual({ error: 'solicitud demasiado grande' });
    sinFuga(duplicated.body);
  });

  // Requisito: RS-1.3
  test('rs1.3 procesa los 87 cursos en menos de 300 ms', async () => {
    const aprobados = repositorio.listar().map(curso => curso.id);
    const start = Date.now();
    const res = await request(app).post('/habilitados').send({ aprobados });
    expect(res.status).toBe(200);
    expect(Date.now() - start).toBeLessThan(300);
  });

  // Requisito: RS-2.1
  test.each(['1INF30<script>', 'inf25', '1INF2', '1INF30\n', ' 1INF25 ', ''])('rs2.1 rechaza codigo invalido %p', async codigo => {
    const res = await request(app).post('/habilitados').send({ aprobados: [codigo] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'solicitud inválida' });
    sinFuga(res.body);
  });

  // Requisito: RS-2.3
  test('rs2.3 mapea errores internos sin fuga', async () => {
    const stubApp = express();
    stubApp.use(express.json());
    stubApp.post('/habilitados', () => { throw new Error('C:\\apps\\malla\\src\\interna.js'); });
    stubApp.use(require('../src/middleware/errors'));

    const res = await request(stubApp).post('/habilitados').send({ aprobados: [] });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'error interno del servidor' });
    sinFuga(res.body);
  });

  // Requisito: RS-3.1
  test.each([
    ['string', { aprobados: '1INF25' }],
    ['object', { aprobados: { 0: '1INF25' } }],
    ['null', { aprobados: null }],
    ['ausente', {}]
  ])('rs3.1 rechaza aprobados como %s', async (_tipo, body) => {
    const res = await request(app).post('/habilitados').send(body);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'solicitud inválida' });
    sinFuga(res.body);
  });

  test('rs3.1 rechaza Content-Type text/plain aunque el body sea JSON', async () => {
    const res = await request(app).post('/habilitados').set('Content-Type', 'text/plain').send('{"aprobados":[]}');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'solicitud inválida' });
    sinFuga(res.body);
  });

  // Requisito: RS-3.2
  test.each([[42], [null], [{}]])('rs3.2 rechaza elemento no string %p', async aprobados => {
    const res = await request(app).post('/habilitados').send({ aprobados });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'solicitud inválida' });
    sinFuga(res.body);
  });

  // Requisito: RS-3.3
  test('rs3.3 array vacio devuelve exactamente los 26 cursos sin prerequisitos', async () => {
    const res = await request(app).post('/habilitados').send({ aprobados: [] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(26);
    expect(res.body.every(curso => curso.prerequisites.length === 0)).toBe(true);
  });
});
