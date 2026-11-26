const request = require('supertest');
const app = require('../src/app');

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
    expect(res.body.length).toBeGreaterThan(0);
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
});
