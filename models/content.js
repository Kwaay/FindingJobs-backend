module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'content',
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
      content: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      link: {
        type: DataTypes.STRING,
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
      tableName: 'content',
      timestamps: true,
    },
  );
