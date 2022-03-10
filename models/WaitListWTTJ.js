module.exports = (Sequelize, DataTypes) =>
  Sequelize.define(
    "waitListWTTJ",
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
      tableName: "waitListWTTJ",
      timestamps: true,
    }
  );
