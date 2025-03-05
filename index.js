const express = require("express");
// const http = require("http");
// const socketIo = require("socket.io");
const app = express();
// const httpserver = http.createServer(app);
const dotEnv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const sequelize = require("./db");
const PORT = process.env.PORT || 5000;
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
require("./models/index");

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
const Page = require("./models/Page");
const RoleChangeRequest = require("./models/RoleChangeRequest");
const foreignKeysetup = require("./models/index");
const PriceCalendar = require("./models/PriceCalendar");
const TravelerHostReview = require("./models/TravelerHostReview");
const HostTravelerReview = require("./models/HostTravelerReview");
const TblCity = require("./models/TblCity");
const PropertyBlock = require("./models/PropertyBlock");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
// Routes
const adminRoutes = require("./routes/adminRoutes");
const countriesRoutes = require("./routes/countriesRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const pagesRoutes = require("./routes/pagesRoutes");
const couponRoutes = require("./routes/couponRoutes");
const packagesRoutes = require("./routes/packagesRoutes");
const facilitiesRoutes = require("./routes/facilitiesRoutes");
const staffRoutes = require("./routes/staffRoutes");
const settingRoutes = require("./routes/settingRoutes");
const paymentListRoutes = require("./routes/paymentListRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const galCatRoutes = require("./routes/galCatRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const extraRoutes = require("./routes/extraRoutes");
const bookRoutes = require("./routes/bookRoutes");
const walletRoutes = require("./routes/walletRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const favRoutes = require("./routes/favRoutes");
const hostRequestRoutes = require("./routes/hostRequestRoutes");
const personRecordRoutes = require("./routes/personRecordRoutes");
const planRoutes = require("./routes/planRoutes");
const payoutRoutes = require("./routes/payoutRoutes");
const faqRoutes = require("./routes/faqsRoutes");
const userFavorites = require("./userRoutes/user_fav_routes");
const cityRoutes = require("./routes/cityRoutes");
// for user
const usercountryRoutes = require("./userRoutes/u_country_route");
// Middlewares
dotEnv.config();
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  cors({
    origin: [
      "https://servostay-flame.vercel.app",
      "https://servostay-ten.vercel.app",
      "http://localhost:3000",
      "https://property-rental-backend-6.onrender.com",
      "http://localhost:58160",
      "https://servostayweb1.vercel.app",
      "https://servostay-three.vercel.app",
    ],
    credentials: true,
  })
);

// app.use(cors({ origin: "*" }));;

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(morgan("dev"));
app.use("/admin", adminRoutes);
app.use("/rollrequest", require("./routes/RoleChangeRequestRoute"));
app.use("/countries", countriesRoutes);
app.use("/categories", categoryRoutes);
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
app.use("/faqs", faqRoutes);
app.use("/cities", cityRoutes);

app.use("/u_dashboard", require("./userRoutes/user_dashboard_route"));

const userPropertyRoutes = require("./userRoutes/u_property_routes");
const userBookings = require("./userRoutes/u_book_routes");
const checkInAvailabilityRoutes = require("./userRoutes/user_check_availablity_routes");
const priceCalendarRoutes = require("./userRoutes/u_price_calendar_routes");
const traverlerReviewRoutes = require("./userRoutes/traveler_host_review_route");
const hostTravelerReviewRoutes = require("./userRoutes/host_traveler_review_routes");
const uCityRoutes = require("./userRoutes/u_city_routes");

app.use("/users", require("./userRoutes/user_auth_router"));
app.use("/u_paymentgateway", require("./userRoutes/user_paymentgateway_route"));
app.use("/user/bookings", userBookings);
app.use("/favorites", userFavorites);
app.use("/user/properties", userPropertyRoutes);
app.use("/u_country", usercountryRoutes);

app.use("/u_facility", require("./userRoutes/user_facilities_route"));
app.use("/u_extralist", require("./userRoutes/u_extra_route"));
app.use("/calender", require("./userRoutes/calender_route"));
app.use("/review", require("./userRoutes/review_list_route"));
app.use("/coupon", require("./userRoutes/u_couponlist_route"));
app.use("/faq", require("./userRoutes/u_faq_route"));
app.use("/u_homedata", require("./userRoutes/u_homedata_route"));
app.use("/check-availability", checkInAvailabilityRoutes);
app.use("/price-calendar", priceCalendarRoutes);
app.use("/traveler-review", traverlerReviewRoutes);
app.use("/host-review", hostTravelerReviewRoutes);
app.use("/u_cities", uCityRoutes);
app.use("/app-settings", require("./userRoutes/setting_routes"));
app.use("/notifications", require("./userRoutes/u_nofifications_routes"));
app.use("/booking-refund", require("./userRoutes/u_refund_routes"));

app.post("/webhook/whatsapp-status", (req, res) => {
  console.log("Received webhook event:", req.body);

  res.sendStatus(200);
});

// const server = app.listen(PORT, () => {
//   console.log(`server running on port ${PORT}`);
// });

app.get("/", (req, res) => {
  // const query
  res.send("Server is Running");
});

const server = app.listen(PORT, () => {
  console.log(`Server is Running on PORT http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

server.timeout = 1200000;

sequelize
  .sync()
  .then(() => {
    console.log("Database & tables created!");
  })
  .catch((err) => {
    console.error("Unable to create the database:", err);
  });
