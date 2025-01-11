const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const TblCategory = require("./TblCategory");

const Property = sequelize.define(
  "Property",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    video:{
      type:DataTypes.TEXT,
      allowNull:true,
    },
    extra_images:{
      type:DataTypes.TEXT,
      allowNull:true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    facility: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    beds: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bathroom: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sqrft: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ptype: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    longtitude: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    listing_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    add_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rules: {
      type: DataTypes.TEXT,
      // allowNull: false,
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    adults: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    children: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    infants: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pets: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_sell: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    setting_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_panorama: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  },
  {
    tableName: "tbl_property",
    charset: "latin1",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = Property;
