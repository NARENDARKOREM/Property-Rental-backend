const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const PersonRecord = sequelize.define('PersonRecord', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, 
        allowNull: false
    },
    book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fname: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    lname: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    gender: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    mobile: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ccode: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    country: {
        type: DataTypes.TEXT,
        allowNull: false,
    }
}, {
    tableName: 'tbl_person_record', 
    charset: 'latin1',  
    timestamps: true,
    paranoid:true 
});

module.exports = PersonRecord;
