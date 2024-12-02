const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const TblEnquiry = sequelize.define('TblEnquiry', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  prop_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uid: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  add_user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tbl_enquiry',
  timestamps: true,
  paranoid: true,
  charset: 'latin1'
});

module.exports = TblEnquiry;
