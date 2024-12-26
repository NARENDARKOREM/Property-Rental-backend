const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    webname: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    weblogo: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    timezone: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    pdboy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    one_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    one_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scredit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rcredit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    show_dark: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    wlimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sms_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    auth_key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    otp_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    acc_id: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    auth_token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    twilio_number: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    otp_auth: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    show_property: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    privacy_policy: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    terms_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_tax:{
      type:DataTypes.FLOAT,
      allowNull:false
    }
  },
  {
    tableName: "tbl_setting",
    charset: "latin1",
    timestamps: true,
    paranoid: true,
  }
);

module.exports = Setting;
