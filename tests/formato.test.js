const formato = require('../src/util/formato');

test('util/formato cubre presentacion de cursos', () => {
  expect(formato.formatearNombre('PROGRAMACION 3')).toBe('Programacion 3');
  expect(formato.formatearCreditos(5)).toBe('5.0 créditos');
  expect(formato.formatearCiclo(null)).toBe('Electivo');
  expect(formato.formatearCiclo(6)).toBe('Ciclo 6');
  expect(formato.formatearTipo('obligatorio')).toBe('Obligatorio');
  const curso = { id: '1INF25', name: 'Introducción', credits: 4.5 };
  expect(formato.resumenCurso(curso)).toBe('1INF25 · Introducción · 4.5 créditos');
  expect(formato.totalCreditos([curso, { credits: 5 }])).toBe(9.5);
  expect(formato.listaRequisitos([])).toBe('Sin requisitos');
  expect(formato.listaRequisitos(['INF238', '1INF25'])).toBe('1INF25, INF238');
});
