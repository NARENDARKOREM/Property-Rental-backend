const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblFav = sequelize.define('TblFav', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  property_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  property_type: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tbl_fav',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblFav;
