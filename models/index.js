const { Sequelize } = require('sequelize');
const sequelizeNoUpdateAttributes = require('sequelize-noupdate-attributes');

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
  },
);

sequelizeNoUpdateAttributes(sequelize);

// Récuperation des models
const waitList = require('./WaitList')(sequelize, Sequelize.DataTypes);
const stack = require('./Stack')(sequelize, Sequelize.DataTypes);
const job = require('./Job')(sequelize, Sequelize.DataTypes);
const settings = require('./Settings')(sequelize, Sequelize.DataTypes);

stack.belongsToMany(job, { through: 'JobHasStack' });
job.belongsToMany(stack, { through: 'JobHasStack' });

sequelize.WaitList = waitList;
sequelize.Stack = stack;
sequelize.Job = job;
sequelize.Settings = settings;

// Tentative d'authentification à la base de données
sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connexion à MySQL valide');
    // Synchronisation des models avec les tables dans la base de données
    sequelize
      .sync()
      .then(() => {
        console.log('Tous les models ont été synchronisés avec succès.');
      })
      .catch(() => {
        console.log('Impossible de synchroniser les models');
      });
  })
  .catch((error) => {
    console.log('❌ Connexion à MySQL invalide', error);
  });

module.exports = sequelize;
