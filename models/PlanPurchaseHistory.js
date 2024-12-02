const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PlanPurchaseHistory = sequelize.define("PlanPurchaseHistory", {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement:true,
    primaryKey: true,
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  p_name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  t_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan_title: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
  plan_description: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: "utf8mb4",
    collate: "utf8mb4_general_ci",
  },
  expire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  trans_id: { 
    type: DataTypes.TEXT, 
    allowNull: false 
},
},{
    tableName:"plan_purchase_history",
    timestamps:true,
    paranoid:true,
    charset:"latin1"
});

module.exports = PlanPurchaseHistory;
