const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/cursos', require('./routes/cursos'));
app.use('/habilitados', require('./routes/habilitados'));

// Generic error-handling middleware — must be registered after all routes
app.use(require('./middleware/errors'));

module.exports = app;
