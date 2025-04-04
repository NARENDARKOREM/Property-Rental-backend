const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ccode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mobile: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    otp: {
      type: DataTypes.STRING,
    },
    otpExpiresAt: {
      type: DataTypes.DATE,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    refercode: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    parentcode: {
      type: DataTypes.INTEGER,
      defaultValue: null,
    },
    wallet: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    reg_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pro_pic: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue:
        "https://thumbs.dreamstime.com/b/profile-placeholder-image-gray-silhouette-no-photo-profile-placeholder-image-gray-silhouette-no-photo-person-avatar-123478438.jpg?w=992",
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    pack_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_subscribe: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    role: {
      type: DataTypes.ENUM("host", "guest"),
      allowNull: false,
      defaultValue: "guest",
    },
    currency: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    country_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    one_subscription:{
      type:DataTypes.TEXT,
      allowNull:true
    },
    languages:{
      type:DataTypes.JSON,
      allowNull:false,
      defaultValue:["English"] 
    },
  },
  {
    tableName: "tbl_user",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = User;
