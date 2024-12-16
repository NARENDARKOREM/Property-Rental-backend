const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const TblExtra = require("./TblExtra");

const TblExtraImage = sequelize.define(
    "TblExtraImage",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      extra_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: TblExtra,
          key: "id",
        },
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "tbl_extra_images",
      timestamps: true,
    }
  );
  


  
  module.exports = TblExtraImage;
  