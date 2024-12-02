const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Page = sequelize.define('Page', {
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
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'tbl_page', 
    charset: 'latin1', 
    collate: 'utf8mb3_general_ci', 
    timestamps: false, 
});

module.exports = Page;
