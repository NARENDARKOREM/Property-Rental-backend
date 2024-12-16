const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblCountry = sequelize.define(
  "TblCountry",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    img: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    d_con: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "tbl_country",
    timestamps: true,
    paranoid: true,
    charset: "latin1",
  }
);

module.exports = TblCountry;
