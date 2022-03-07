const { Sequelize } = require("sequelize");
const sequelizeNoUpdateAttributes = require("sequelize-noupdate-attributes");

require("dotenv").config();

// Connexion à la base de données
const sequelize = new Sequelize(
  process.env.DB_BDD,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: "localhost",
    dialect: "mysql",
    timezone: "+01:00",
  }
);

sequelizeNoUpdateAttributes(sequelize);

// Récuperation des models
const wttj = require("./welcometothejungle")(sequelize, Sequelize.DataTypes);
const stack = require("./stack")(sequelize, Sequelize.DataTypes);


sequelize.Wttj = wttj;
sequelize.Stack = stack;

// Tentative d'authentification à la base de données
sequelize
  .authenticate()
  .then(() => {
    console.log("✅ Connexion à MySQL valide");
    // Synchronisation des models avec les tables dans la base de données
    sequelize
      .sync()
      .then(() => {
        console.log("Tous les models ont été synchronisés avec succès.");
      })
      .catch(() => {
        console.log("Impossible de synchroniser les models");
      });
  })
  .catch((error) => {
    console.log("❌ Connexion à MySQL invalide", error);
  });

module.exports = sequelize;
