const express = require("express");
const app = express();
const dotEnv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const session = require("express-session");
const path = require('path');
const sequelize = require("./db");
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const PORT = process.env.PORT || 5000;

<<<<<<< HEAD
=======

// Routes
const adminRoutes = require('./routes/adminRoutes');

>>>>>>> origin/suresh
// Models
const Admin = require("./models/Admin");
const PayoutSetting = require("./models/PayoutSetting");
const PlanPurchaseHistory = require("./models/PlanPurchaseHistory");
const TblBook = require("./models/TblBook");
const TblCategory = require("./models/TblCategory");
const TblCountry = require("./models/TblCountry");
const TblCoupon = require("./models/TblCoupon");
const TblEnquiry = require("./models/TblEnquiry");
const TblExtra = require("./models/TblExtra");
const TblFacility = require("./models/TblFacility");
const TblFaq = require("./models/TblFaq");
const TblFav = require("./models/TblFav");
const TblGallery = require("./models/TblGallery");
const TblGalCat = require("./models/TblGalCat");
const TblNotification = require("./models/TblNotification");
const Package = require("./models/TblPackage");
<<<<<<< HEAD
const Page = require("./models/Page");
const PaymentList = require("./models/PaymentList");
const PersonRecord = require("./models/PersonRecord");
const Property = require("./models/Property");
const TblProp = require("./models/TblProp");
const Setting = require("./models/Setting");
const User = require("./models/User");
const Staff = require("./models/Staff");
const WalletReport = require("./models/WalletReport");
=======
const Page = require('./models/Page');
const PaymentList = require('./models/PaymentList');
const PersonRecord = require('./models/PersonRecord');
const Property = require('./models/Property');
const TblProp = require('./models/TblProp');
const Setting = require('./models/Setting');
const User = require('./models/user');
const Staff = require('./models/Staff');
const WalletReport = require("./models/walletReport");
>>>>>>> origin/suresh

// Routes
const adminRoutes = require("./routes/adminRoutes");
const countriesRoutes = require("./routes/countriesRoutes");
const categoryRoutes = require('./routes/categoryRoutes');

// Middlewares
dotEnv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use("/admin", adminRoutes);
app.use("/countries", countriesRoutes);
app.use("/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Server is Running");
});

<<<<<<< HEAD
sequelize
  .sync()
  .then(() => {
    console.log("Database & tables created!");
  })
  .catch((err) => {
    console.error("Unable to create the database:", err);
  });

app.listen(PORT, () => {
  console.log(`Server is Running on PORT http://localhost:${PORT}`);
});
=======
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

>>>>>>> origin/suresh
