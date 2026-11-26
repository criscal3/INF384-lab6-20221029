const { calcular } = require('../src/services/habilitados');

test('verificar orden id ascendente en la respuesta', () => {
  const ids = calcular([]).map(curso => curso.id);
  expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
});
