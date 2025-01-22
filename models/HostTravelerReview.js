const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const HostTravelerReview = sequelize.define(
  "HostTravelerReview",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    host_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    traveler_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    booking_id: {
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
  { tableName: "tbl_host_traveler_review", timestamps: true }
);

module.exports = HostTravelerReview;
