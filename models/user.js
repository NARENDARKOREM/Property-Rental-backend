const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, 
        allowNull: false
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ccode: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    mobile: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    refercode: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    parentcode: {
        type: DataTypes.INTEGER, // Allows `NULL` by default
        defaultValue: null,
    },
    wallet: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0, // Matches the SQL DEFAULT value
    },
    reg_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1, // Matches the SQL DEFAULT value
    },
    pro_pic: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'assets/images/dashboard/profile.png', // Matches the SQL DEFAULT value
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    pack_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Matches the SQL DEFAULT value
    },
    is_subscribe: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Matches the SQL DEFAULT value
    }
}, {
    tableName: 'tbl_user', // Matches the SQL table name
    charset: 'latin1', // Matches DEFAULT CHARSET=latin1
    timestamps: true, // Disables automatic createdAt and updatedAt fields
    paranoid:true
});

module.exports = User;
