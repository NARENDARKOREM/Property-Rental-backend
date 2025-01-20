const express = require("express");
const userDashboardController = require('../userControllers/u_dashboard_controller');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/all", authMiddleware.isAuthenticated,userDashboardController.dashboardData);
router.get("/total-earnings-bymonth", authMiddleware.isAuthenticated,userDashboardController.TotalEarningsByMonth);
router.get("/listing-properties", authMiddleware.isAuthenticated,userDashboardController.listingProperties);
router.get("/list-by-location", authMiddleware.isHost,userDashboardController.listByLocations);
router.get("/avg-customer-reviews", authMiddleware.isHost,userDashboardController.averageCustomerReviews);
router.get("/total-reviews", authMiddleware.isHost,userDashboardController.totalReviewCount);
router.get("/total-nights", authMiddleware.isHost,userDashboardController.totalNightsBookedByTraveler);
router.get("/average-nights",authMiddleware.isHost,userDashboardController.averageNightBookingByTraveler);

module.exports = router;
