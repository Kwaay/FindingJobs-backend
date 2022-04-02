module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'waitList',
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
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      origin: {
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
      tableName: 'waitList',
      timestamps: true,
    },
  );
