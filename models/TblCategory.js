const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblCategory = sequelize.define('TblCategory', {
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
    allowNull: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tbl_category',
  timestamps: true,
  paranoid:true,
  charset: 'latin1'
});

module.exports = TblCategory;
