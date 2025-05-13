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
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    video: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    extra_images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facility: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    beds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    bathroom: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    sqrft: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    ptype: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    longtitude: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mobile: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    listing_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    add_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    adults: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    children: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    infants: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_sell: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    setting_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_panorama: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    standard_rules: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    extra_guest_charges: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0.0,
    },
    block_start: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    block_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ical_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ical_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    video_url:{
      type:DataTypes.TEXT,
      allowNull:true
    },
    accept:{
      type:DataTypes.BOOLEAN,
      allowNull:true,
    },
    is_draft:{
      type:DataTypes.BOOLEAN,
      allowNull:false,
      defaultValue:false
    },
  },
  {
    tableName: "tbl_property",
    charset: "latin1",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = Property;
