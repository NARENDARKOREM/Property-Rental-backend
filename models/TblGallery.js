const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblGallery = sequelize.define(
  "TblGallery",
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
    cat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    img: {
      type: DataTypes.TEXT,
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
    tableName: "tbl_gallery",
    timestamps: true,
    paranoid: true,
    charset: "latin1",
  }
);

module.exports = TblGallery;
