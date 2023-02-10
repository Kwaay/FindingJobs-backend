module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'Jobs',
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        noUpdate: {
          readOnly: true,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      contract: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      salary: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remote: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      exp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      study: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      origin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'jobs',
      timestamps: true,
    },
  );
