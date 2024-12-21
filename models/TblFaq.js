const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblFaq = sequelize.define(
  "TblFaq",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      charset: "utf8mb3",
      collate: "utf8mb3_general_ci",
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      charset: "utf8mb3",
      collate: "utf8mb3_general_ci",
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "tbl_faq",
    timestamps: true,
    paranoid: true,
    charset: "latin1",
  }
);

module.exports = TblFaq;
