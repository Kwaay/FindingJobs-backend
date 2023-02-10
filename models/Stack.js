module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'Stack',
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
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      regex: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      logo: {
        type: DataTypes.STRING.BINARY,
        allowNull: false,
      },
      visibility: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      tableName: 'stack',
    },
  );
