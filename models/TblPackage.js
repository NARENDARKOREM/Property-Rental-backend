const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Assuming 'db.js' is where the connection is established

const TblPackage = sequelize.define(
  "TblPackage",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_package",
    charset: "latin1",
    timestamps: true, // Enable timestamps
    paranoid: true, // Enable paranoid mode for soft deletion
  }
);

module.exports = TblPackage;
