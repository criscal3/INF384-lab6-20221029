const request = require('supertest');
const app = require('../src/app');

describe('GET /cursos/:codigo', () => {
  // Valida: Requisito 2.1
  test('con código existente devuelve el curso con requisitos (id y nombre)', async () => {
    const res = await request(app).get('/cursos/1INF30');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: '1INF30',
      name: 'Programación 3',
      credits: 5.0,
      cycle: 6,
      type: 'obligatorio',
      prerequisites: [{ id: '1INF25', name: 'Programación 2' }],
    });
  });

  // Valida: Requisito 2.1
  test('resuelve el nombre de cada requisito (curso con varios requisitos)', async () => {
    const res = await request(app).get('/cursos/1INF32');

    expect(res.status).toBe(200);
    expect(res.body.prerequisites).toEqual([
      { id: '1INF27', name: 'Algoritmia y Estructura de Datos' },
      { id: '1INF25', name: 'Programación 2' },
    ]);
  });

  // Valida: Requisito 2.1
  test('curso sin requisitos devuelve prerequisites vacío', async () => {
    const res = await request(app).get('/cursos/1INF25');

    expect(res.status).toBe(200);
    expect(res.body.prerequisites).toEqual([]);
  });

  // Valida: Requisito 2.2
  test('con código inexistente responde 404 con error', async () => {
    const res = await request(app).get('/cursos/XXX999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'curso no encontrado' });
  });
});
