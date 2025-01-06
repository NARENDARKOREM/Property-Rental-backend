const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TblBook = sequelize.define(
  "TblBook",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    prop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    book_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    check_in: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    check_out: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    tax: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    cou_amt: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    wall_amt: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    transaction_id: {
      type: DataTypes.TEXT,
    },
    p_method_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    add_note: {
      type: DataTypes.TEXT,
    },
    book_status: {
      type: DataTypes.ENUM(
        "Booked",
        "Check_in",
        "Completed",
        "Cancelled",
        "Confirmed"
      ),
      allowNull: false,
      defaultValue: "Booked",
    },
    book_for: {
      type: DataTypes.ENUM("self", "other"),
      allowNull: false,
    },
    is_rate: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_rate: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    rate_text: {
      type: DataTypes.TEXT,
      charset: "utf8mb4",
      collate: "utf8mb4_general_ci",
    },
    prop_price: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cancle_reason: {
      type: DataTypes.TEXT,
    },
    total_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prop_img: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    prop_title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    add_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    check_intime: {
      type: DataTypes.DATE,
    },
    check_outtime: {
      type: DataTypes.DATE,
    },
    noguest: {
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
  },
  {
    tableName: "tbl_book",
    timestamps: true,
    paranoid: true,
    charset: "latin1",
  }
);

module.exports = TblBook;
