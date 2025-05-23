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
    },
    img: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cities: {
      type: DataTypes.JSON,
      allowNull: true,
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
    currency: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "INR",
    },
  },
  {
    tableName: "tbl_country",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = TblCountry;
