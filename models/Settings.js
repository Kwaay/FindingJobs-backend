module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'Settings',
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
      browser: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      useragent: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        noUpdate: {
          readOnly: true,
        },
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        noUpdate: true,
      },
    },
    {
      tableName: 'settings',
      timestamps: true,
    },
  );
