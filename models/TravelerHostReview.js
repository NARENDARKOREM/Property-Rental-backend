const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TravelerHostReview = sequelize.define(
  "TravelerHostReview",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    traveler_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    host_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { tableName: "tbl_traveler_host_review", timestamps: true }
);

module.exports = TravelerHostReview;
