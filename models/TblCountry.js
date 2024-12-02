const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblCountry = sequelize.define('TblCountry', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  img: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  d_con: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'tbl_country',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblCountry;
