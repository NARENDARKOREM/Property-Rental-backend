const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Prop = sequelize.define('Prop', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, 
        allowNull: false
    },
    data: {
        type: DataTypes.TEXT('long'), 
        allowNull: false,
    }
}, {
    tableName: 'tbl_prop', // Matches the SQL table name
    charset: 'utf8mb4', // Matches DEFAULT CHARSET=utf8mb4
    collate: 'utf8mb4_general_ci', // Matches COLLATE=utf8mb4_general_ci
    timestamps: false, // Disables automatic createdAt and updatedAt fields
});

module.exports = Prop;
