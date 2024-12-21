const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PayoutSetting = sequelize.define(
  "PayoutSetting",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    amt: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    proof: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    r_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    r_type: {
      type: DataTypes.ENUM("UPI", "BANK Transfer", "Paypal"),
      allowNull: false,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    acc_number: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    bank_name: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    acc_name: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    ifsc_code: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    upi_id: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    paypal_id: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
  },
  {
    tableName: "payout_setting",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = PayoutSetting;
