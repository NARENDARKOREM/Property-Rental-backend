const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Package = sequelize.define('Package', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, 
        allowNull: false
    },
    title: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    image: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    day: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'tbl_package', 
    charset: 'latin1', 
    collate: 'utf8mb4_general_ci', 
    timestamps: false, 
});

module.exports = Package;
