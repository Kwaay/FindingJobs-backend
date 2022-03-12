const express = require('express');

// Récupération des routes
const wttjRoutes = require('./routes/welcometothejungle');
const stackRoutes = require('./routes/stack');

const app = express();

// Mise en place des headers
app.use((_req, res, next) => {
  res.setHeader(
    'Access-Control-Allow-Origin',
    process.env.APP_ENV === 'production' ? 'www.groupomania.fr' : '*',
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  );
  next();
});

app.use(express.json({ limit: '50mb' }));

// Base URL pour les routes
app.use('/api/wttj', wttjRoutes);
app.use('/api/stack', stackRoutes);

module.exports = app;
