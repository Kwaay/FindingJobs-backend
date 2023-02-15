const { Sequelize } = require('sequelize');
const sequelizeNoUpdateAttributes = require('sequelize-noupdate-attributes');
const Logger = require('../lib/Logger');

require('dotenv').config();

// Connexion à la base de données
const sequelize = new Sequelize(
  process.env.DB_BDD,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+01:00',
    logging: false,
  },
);

sequelizeNoUpdateAttributes(sequelize);

// Récuperation des models
const user = require('./User')(sequelize, Sequelize.DataTypes);
const waitList = require('./WaitList')(sequelize, Sequelize.DataTypes);
const stack = require('./Stack')(sequelize, Sequelize.DataTypes);
const job = require('./Job')(sequelize, Sequelize.DataTypes);
const userAgent = require('./UserAgent')(sequelize, Sequelize.DataTypes);

const content = require('./content')(sequelize, Sequelize.DataTypes);

stack.belongsToMany(job, { through: 'JobHasStack' });
job.belongsToMany(stack, { through: 'JobHasStack' });

sequelize.User = user;
sequelize.WaitList = waitList;
sequelize.Stack = stack;
sequelize.Job = job;
sequelize.UserAgent = userAgent;
sequelize.Content = content;

// Tentative d'authentification à la base de données
sequelize
  .authenticate()
  .then(() => {
    Logger.success('Connexion à MySQL valide');
    // Synchronisation des models avec les tables dans la base de données
    sequelize
      .sync()
      .then(() => {
        Logger.success('Tous les models ont été synchronisés avec succès.');
      })
      .catch(() => {
        Logger.fail('Impossible de synchroniser les models');
      });
  })
  .catch((error) => {
    Logger.fail('Connexion à MySQL invalide', error);
  });

module.exports = sequelize;
