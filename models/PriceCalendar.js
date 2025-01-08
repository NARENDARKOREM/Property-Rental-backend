const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const PriceCalendar = sequelize.define(
  "PriceCalendar",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
  },  
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    prop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,
    tableName: "tbl_price_calendar",
  }
);

module.exports = PriceCalendar;
