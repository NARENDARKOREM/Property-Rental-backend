const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

const TblNotification = sequelize.define('TblNotification', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement:true,
    primaryKey: true
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  datetime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'tbl_notification',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblNotification;
