const express = require("express");
const app = express();
const dotEnv = require("dotenv");
const sequelize = require("./db")
const PORT = process.env.PORT || 5000;
dotEnv.config();

const Admin = require("./models/Admin");
const PayoutSetting = require("./models/PayoutSetting");
const PlanPurchaseHistory = require("./models/PlanPurchaseHistory");
const TblBook = require("./models/TblBook");
const TblCategory = require("./models/TblCategory");
const TblCountry = require('./models/TblCountry');
const TblCoupon = require('./models/TblCoupon');
const TblEnquiry = require('./models/TblEnquiry');
const TblExtra = require('./models/TblExtra');
const TblFacility = require("./models/TblFacility");
const TblFaq = require('./models/TblFaq');
const TblFav = require('./models/TblFav');
const TblGallery = require('./models/TblGallery');
const TblGalCat = require('./models/TblGalCat');
const TblNotification =require('./models/TblNotification');

app.get('/',(req,res)=>{
    res.send("Server is Running");
})

sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    })
    .catch(err => {
        console.error('Unable to create the database:', err);
    });

app.listen(PORT,()=>{
    console.log(`Server is Running on PORT http://localhost:${PORT}`);
})

