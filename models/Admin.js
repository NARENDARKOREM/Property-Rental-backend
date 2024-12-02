const {DataTypes} = require("sequelize");
const sequelize = require("../db");

const Admin = sequelize.define("Admin",{
    id:{
        type:DataTypes.INTEGER,
        allowNull:false,
        primaryKey:true
    },
    username:{
        type:DataTypes.TEXT,
        allowNull:false
    },
    password:{
        type:DataTypes.TEXT,
        allowNull:false,
    }
},{
    tableName:'admin',
    timestamps:true,
    paranoid:true
});

module.exports = Admin;