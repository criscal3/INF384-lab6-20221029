const path = require('path');
const express = require('express');
const repositorio = require('./data/repositorio');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', cursos: repositorio.listar().length });
});

app.use('/habilitados', express.json({ limit: '2kb' }), require('./routes/habilitados'));
app.use(express.json());
app.use('/cursos', require('./routes/cursos'));

// Generic error-handling middleware — must be registered after all routes
app.use(require('./middleware/errors'));

module.exports = app;
