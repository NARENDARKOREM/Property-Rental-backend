const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblProp = sequelize.define(
  "TblProp",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    data: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
  },
  {
    tableName: "tbl_prop", // Matches the SQL table name
    charset: "utf8mb4", // Matches DEFAULT CHARSET=utf8mb4
    timestamps: true, // Disables automatic createdAt and updatedAt fields
    paranoid: true,
  }
);

module.exports = TblProp;
