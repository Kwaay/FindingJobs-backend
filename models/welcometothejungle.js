module.exports = (Sequelize, DataTypes) =>
  Sequelize.define(
    "Wttj",
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
      link: {
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
      tableName: "wttj",
      timestamps: true,
    }
  );
