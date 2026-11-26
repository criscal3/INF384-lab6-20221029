const request = require('supertest');
const app = require('../src/app');

describe('GET /cursos', () => {
  // Valida: Requisitos 1.1
  test('1.1 devuelve todos los cursos con id, name, credits, cycle y type', async () => {
    const res = await request(app).get('/cursos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(87);

    for (const curso of res.body) {
      expect(typeof curso.id).toBe('string');
      expect(typeof curso.name).toBe('string');
      expect(typeof curso.credits).toBe('number');
      expect('cycle' in curso).toBe(true); // cycle puede ser número o null
      expect(curso.type).toMatch(/^(obligatorio|electivo)$/);
    }
  });

  // Valida: Requisitos 1.2
  test('1.2 con ciclo=6 devuelve solo los cursos del ciclo 6', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 6 });

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((curso) => curso.cycle === 6)).toBe(true);
    expect(res.body).toHaveLength(7);
  });

  // Valida: Requisitos 1.2
  test('1.2 el ciclo 10 (límite superior válido) devuelve sus 3 cursos', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body.every((curso) => curso.cycle === 10)).toBe(true);
  });

  // Valida: Requisitos 1.2
  test('1.2 el ciclo 5 (límite inferior válido) devuelve los cursos del ciclo 5', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 5 });

    expect(res.status).toBe(200);
    expect(res.body.every((curso) => curso.cycle === 5)).toBe(true);
  });

  // Valida: Requisitos 1.3
  test('1.3 ciclo=4 (fuera de rango) responde 400 con mensaje de error', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 4 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  // Valida: Requisitos 1.3
  test('1.3 ciclo=11 (fuera de rango) responde 400 con mensaje de error', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 11 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  // Valida: Requisitos 1.3
  test('1.3 ciclo no entero (abc) responde 400 con mensaje de error', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });

  // Valida: Requisitos 1.3
  test('1.3 ciclo decimal (6.5) responde 400 con mensaje de error', async () => {
    const res = await request(app).get('/cursos').query({ ciclo: '6.5' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ciclo debe ser un entero entre 5 y 10' });
  });
});
