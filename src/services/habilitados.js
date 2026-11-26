const _ = require('lodash');
const repositorio = require('../data/repositorio');

function calcular(aprobados) {
  const set = new Set(aprobados);
  const habilitados = repositorio.listar().filter(curso =>
    !set.has(curso.id) && curso.prerequisites.every(requisito => set.has(requisito))
  );
  return _.sortBy(habilitados, 'id');
}

module.exports = { calcular };
