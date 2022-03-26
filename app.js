const express = require('express');
const useragent = require('express-useragent');

// Récupération des routes
const processWaitListRoutes = require('./routes/processWaitList');
const wttjRoutes = require('./routes/welcometothejungle');
const peRoutes = require('./routes/pole-emploi');
const monsterRoutes = require('./routes/monster');
const stackRoutes = require('./routes/stack');
const settingsRoutes = require('./routes/settings');

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
app.use(useragent.express());

// Base URL pour les routes
app.use('/api/waitlist', processWaitListRoutes);
app.use('/api/wttj', wttjRoutes);
app.use('/api/pe', peRoutes);
app.use('/api/monster', monsterRoutes);
app.use('/api/stack', stackRoutes);
app.use('/api/settings', settingsRoutes);

module.exports = app;
