const express = require('express');
const habilitadosService = require('../services/habilitados');
const { validarAprobados } = require('../util/validacion');

const router = express.Router();

router.post('/', (req, res) => {
  const error = validarAprobados(req.body);
  if (error) return res.status(error.status).json(error.body);
  const cursos = habilitadosService.calcular(req.body.aprobados);
  return res.json(cursos);
});

module.exports = router;
