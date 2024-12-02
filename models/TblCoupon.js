const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblCoupon = sequelize.define('TblCoupon', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  c_img: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  cdate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  c_desc: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb3',
    collate: 'utf8mb3_general_ci'
  },
  c_value: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  c_title: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb3',
    collate: 'utf8mb3_general_ci'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  ctitle: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb3',
    collate: 'utf8mb3_general_ci'
  },
  min_amt: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  subtitle: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb3',
    collate: 'utf8mb3_general_ci'
  }
}, {
  tableName: 'tbl_coupon',
  timestamps: true,
  paranoid:true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci'
});

module.exports = TblCoupon;
