const express = require('express');
const repositorio = require('../data/repositorio');

const router = express.Router();

router.get('/', (req, res) => {
  const { ciclo } = req.query;

  if (ciclo !== undefined) {
    const cicloNum = Number(ciclo);

    if (!Number.isInteger(cicloNum) || cicloNum < 5 || cicloNum > 10) {
      return res.status(400).json({ error: 'ciclo debe ser un entero entre 5 y 10' });
    }

    return res.json(repositorio.listarPorCiclo(cicloNum));
  }

  return res.json(repositorio.listar());
});

router.get('/:codigo', (req, res) => {
  const curso = repositorio.obtener(req.params.codigo);

  if (!curso) {
    return res.status(404).json({ error: 'curso no encontrado' });
  }

  // Resolve each prerequisite code into { id, name }
  const prerequisites = curso.prerequisites.map((preReqId) => {
    const prereq = repositorio.obtener(preReqId);
    return { id: preReqId, name: prereq ? prereq.name : preReqId };
  });

  return res.json({ ...curso, prerequisites });
});

module.exports = router;
