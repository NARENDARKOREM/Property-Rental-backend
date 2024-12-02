const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblFacility = sequelize.define('TblFacility', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement:true,
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
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tbl_facility',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblFacility;
