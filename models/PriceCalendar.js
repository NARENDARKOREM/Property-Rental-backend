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
      type: DataTypes.DATE,
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
  },
  {
    timestamps: false,
    tableName: "tbl_price_calendar",
  }
);

module.exports = PriceCalendar;
