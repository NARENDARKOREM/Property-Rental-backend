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
const morgan = require('morgan')

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
const PersonRecord = require("./models/PersonRecord");
const PaymentList = require("./models/PaymentList");
const Property = require("./models/Property");
const TblProp = require("./models/TblProp");
const Setting = require("./models/Setting");
const User = require("./models/User");
const Staff = require("./models/Staff");
const WalletReport = require("./models/WalletReport");
const Page = require('./models/Page');
const RoleChangeRequest = require('./models/RoleChangeRequest');
const foreignKeysetup = require('./models/index');


// Routes
const adminRoutes = require("./routes/adminRoutes");
const countriesRoutes = require("./routes/countriesRoutes");
const categoryRoutes = require('./routes/categoryRoutes');
const pagesRoutes = require("./routes/pagesRoutes");
const couponRoutes = require("./routes/couponRoutes");
const packagesRoutes = require('./routes/packagesRoutes');
const facilitiesRoutes = require('./routes/facilitiesRoutes');
const staffRoutes = require('./routes/staffRoutes');
const settingRoutes = require('./routes/settingRoutes');
const paymentListRoutes = require('./routes/paymentListRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const galCatRoutes = require('./routes/galCatRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const extraRoutes = require("./routes/extraRoutes");
const bookRoutes = require('./routes/bookRoutes');
const walletRoutes = require('./routes/walletRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const favRoutes = require('./routes/favRoutes');
const hostRequestRoutes = require('./routes/hostRequestRoutes');
const personRecordRoutes = require('./routes/personRecordRoutes');
const planRoutes = require('./routes/planRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const faqRoutes = require('./routes/faqsRoutes');

// Middlewares
dotEnv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true 
}));
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

app.use(morgan('dev'))
app.use("/admin", adminRoutes);
app.use("/rollrequest",require('./routes/RoleChangeRequestRoute'));
app.use("/countries", countriesRoutes);
app.use("/categories", categoryRoutes);
app.use('/users', require('./userRoutes/user_auth_router'));
app.use("/pages", pagesRoutes);
app.use("/coupons", couponRoutes);
app.use("/packages", packagesRoutes);
app.use("/facilities", facilitiesRoutes);
app.use("/staff", staffRoutes);
app.use("/settings", settingRoutes);
app.use("/payment-methods", paymentListRoutes);
app.use("/properties", propertyRoutes);
app.use("/galleryCategories", galCatRoutes);
app.use("/galleries", galleryRoutes);
app.use("/extra", extraRoutes);
app.use("/bookings", bookRoutes);
app.use("/wallet", walletRoutes);
app.use("/enquiries", enquiryRoutes);
app.use("/favorites", favRoutes);
app.use("/host-request", hostRequestRoutes);
app.use("/person-records", personRecordRoutes);
app.use("/plans", planRoutes);
app.use("/payout-settings", payoutRoutes);
app.use("/faq",faqRoutes)

app.get("/", (req, res) => {
  // const query
  res.send("Server is Running");
});


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
