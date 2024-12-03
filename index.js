const express = require("express");
const app = express();
const dotEnv = require("dotenv");
const sequelize = require("./db")
const PORT = process.env.PORT || 5000;
dotEnv.config();
const bodyparser = require("body-parser");
const cors = require("cors");

app.use(bodyparser.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
}));

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
const Package = require("./models/TblPackage");
const Page = require('./models/Page');
const PaymentList = require('./models/PaymentList');
const PersonRecord = require('./models/PersonRecord');
const Property = require('./models/Property');
const TblProp = require('./models/TblProp');
const Setting = require('./models/Setting');
const User = require('./models/user');
const Staff = require('./models/Staff');
const WalletReport = require("./models/walletReport");


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

app.use('/users',require('./userRoutes/user_auth_router'))

