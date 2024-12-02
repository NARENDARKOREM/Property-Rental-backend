const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Admin = sequelize.define('Admin', {
  id: {type: DataTypes.INTEGER, allowNull: false, autoIncrement: true,primaryKey: true},
  username: {type: DataTypes.STRING, allowNull: false},
  password: {type: DataTypes.STRING, allowNull: false},
  userType: {type: DataTypes.STRING, allowNull: false}
}, {tableName: 'admin',timestamps: true, paranoid: true});

module.exports = Admin;
