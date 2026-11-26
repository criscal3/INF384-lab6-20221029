const fc = require('fast-check');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const repositorio = require('../src/data/repositorio');
const { calcular } = require('../src/services/habilitados');

// Feature: habilitados, Propiedad 1: Bicondicional de habilitación
test('Propiedad 1 — Bicondicional de habilitación', async () => {
  const cursos = repositorio.listar();
  const ids = cursos.map(curso => curso.id);
  await fc.assert(fc.asyncProperty(fc.shuffledSubarray(ids, { minLength: 0, maxLength: ids.length }), async aprobados => {
    const set = new Set(aprobados);
    const resultado = calcular(aprobados);
    for (const curso of resultado) {
      expect(set.has(curso.id)).toBe(false);
      expect(curso.prerequisites.every(requisito => set.has(requisito))).toBe(true);
    }
    for (const curso of cursos) {
      if (!set.has(curso.id) && curso.prerequisites.every(requisito => set.has(requisito))) {
        expect(resultado.map(item => item.id)).toContain(curso.id);
      }
    }
  }), { numRuns: 200 });
}, 30000);

// Feature: habilitados, Propiedad 2: Rechazo universal de códigos inválidos
test('Propiedad 2 — Rechazo universal de códigos inválidos', async () => {
  await fc.assert(fc.asyncProperty(fc.oneof(
    fc.constant('inf25'), fc.constant(' 1INF25 '), fc.constant('1INF30\n'),
    fc.constant('1INF30<script>'), fc.constant(''), fc.string({ minLength: 1, maxLength: 20 })
  ), async codigo => {
    if (/^(?:[0-9][A-Z]{3}[0-9]{2}|[A-Z]{3}[0-9]{3})$/.test(codigo) && !codigo.includes('\n')) return;
    const res = await request(app).post('/habilitados').send({ aprobados: [codigo] });
    expect(res.status).toBe(400);
  }), { numRuns: 100 });
}, 30000);

// Feature: habilitados, Propiedad 3: No fuga de información interna
test('Propiedad 3 — No fuga de información interna', async () => {
  await fc.assert(fc.asyncProperty(fc.string({ minLength: 1, maxLength: 12 }), async codigo => {
    const res = await request(app).post('/habilitados').send({ aprobados: [codigo] });
    if (res.status >= 400) {
      const serialized = JSON.stringify(res.body);
      expect(serialized).not.toContain('stack');
      expect(serialized).not.toContain('C:');
      expect(serialized).not.toContain('\\');
      expect(serialized).not.toContain('src/');
    }
  }), { numRuns: 100 });
}, 30000);

// Feature: habilitados, Propiedad 4: Idempotencia de duplicados
test('Propiedad 4 — Idempotencia de duplicados', () => {
  const idsValidos = repositorio.listar().map(curso => curso.id);
  fc.assert(fc.property(fc.array(fc.constantFrom(...idsValidos), { minLength: 0, maxLength: 87 }), aprobados => {
    expect(calcular(aprobados)).toEqual(calcular([...new Set(aprobados)]));
  }), { numRuns: 100 });
});

// Feature: habilitados, Propiedad 5: Tolerancia a inexistentes
test('Propiedad 5 — Tolerancia a inexistentes', () => {
  const idsValidos = repositorio.listar().map(curso => curso.id);
  fc.assert(fc.property(fc.array(fc.constantFrom(...idsValidos), { minLength: 0, maxLength: 87 }), aprobados => {
    expect(calcular(aprobados)).toEqual(calcular([...aprobados, 'INF999']));
  }), { numRuns: 100 });
});

describe('Integridad de datos', () => {
  test('87 cursos y cero referencias colgantes', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cursos.json'), 'utf8'));
    const cursos = raw.courses;
    expect(cursos).toHaveLength(87);
    const ids = new Set(cursos.map(curso => curso.id));
    for (const curso of cursos) {
      for (const requisito of curso.prerequisites) expect(ids.has(requisito)).toBe(true);
    }
  });
});
