const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PaymentList = sequelize.define('PaymentList', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, 
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb3',
  },
  img: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attributes: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  subtitle: {
    type: DataTypes.TEXT,
    charset: 'utf8mb3',

  },
  p_show: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  s_show: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'tbl_payment_list', 
  charset: 'latin1',  
  timestamps: true, 
  paranoid: true 
});

module.exports = PaymentList;
