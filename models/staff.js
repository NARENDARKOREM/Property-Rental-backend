const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Staff = sequelize.define('Staff', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Ensures `id` auto-increments
        allowNull: false
    },
    country: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    coupon: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    enquiry: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    payout: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    property: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    eimg: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    facility: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    gcat: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    gal: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    package: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    booking: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    page: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    faq: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    ulist: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    payment: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    email: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
}, {
    tableName: 'tbl_staff', // Matches the SQL table name
    charset: 'utf8mb4', // Matches DEFAULT CHARSET=utf8mb4
    collate: 'utf8mb4_general_ci', // Matches COLLATE=utf8mb4_general_ci
    timestamps: false, // Disables automatic createdAt and updatedAt fields
});

module.exports = Staff;
