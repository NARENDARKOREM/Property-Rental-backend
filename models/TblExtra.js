const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Property = require("./Property");

const TblExtra = sequelize.define(
  "TblExtra",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    pid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    add_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    
  },
  {
    tableName: "tbl_extra",
    timestamps: true,
    paranoid: true,
    charset: "latin1",
  }
);

TblExtra.belongsTo(Property, { foreignKey: "pid" });

module.exports = TblExtra;
