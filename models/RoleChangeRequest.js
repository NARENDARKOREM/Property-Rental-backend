const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RoleChangeRequest = sequelize.define(
  "RoleChangeRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    requested_role: {
      type: DataTypes.ENUM("guest", "host"),
      allowNull: false,
    },
    id_proof:{
          type: DataTypes.STRING,
          allowNull:false,
    },
    id_proof_img:{
          type: DataTypes.STRING,
          allowNull:false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "role_change_requests",
    timestamps: false,
  }
);

module.exports = RoleChangeRequest;
