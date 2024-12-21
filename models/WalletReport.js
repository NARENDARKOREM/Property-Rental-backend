const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const WalletReport = sequelize.define(
  "WalletReport",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    uid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amt: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tdate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "wallet_report", // Matches the SQL table name
    charset: "latin1", // Matches DEFAULT CHARSET=latin1
    timestamps: true, // Disables automatic createdAt and updatedAt fields
    paranoid: true,
  }
);

module.exports = WalletReport;
