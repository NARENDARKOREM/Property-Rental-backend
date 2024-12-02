const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblGalCat = sequelize.define('TblGalCat', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  pid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  add_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'tbl_gal_cat',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblGalCat;
