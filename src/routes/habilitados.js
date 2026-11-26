const express = require('express');
const habilitadosService = require('../services/habilitados');

const router = express.Router();

router.post('/', (req, res) => {
  const cursos = habilitadosService.calcular(req.body.aprobados);
  return res.json(cursos);
});

module.exports = router;
