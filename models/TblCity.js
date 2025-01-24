const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblCity = sequelize.define(
  "TblCity",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    img: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { tableName: "tbl_city", paranoid: true, timestamps: true }
);
module.exports = TblCity;
