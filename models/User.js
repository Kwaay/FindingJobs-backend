module.exports = (Sequelize, DataTypes) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  Sequelize.define(
    'User',
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
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      question: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      awswer: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar: {
        type: DataTypes.STRING.BINARY,
        allowNull: true,
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
    },
  );
