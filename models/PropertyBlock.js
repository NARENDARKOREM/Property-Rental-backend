const sequelize = require("../db");
const { DataTypes } = require("sequelize");

const PropertyBlock = sequelize.define(
  "PropertyBlock",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    prop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    block_start: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    block_end: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "tbl_property_block",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = PropertyBlock;
