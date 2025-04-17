const express = require("express");
const userDashboardController = require('../userControllers/u_dashboard_controller');
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/all", authMiddleware.isAuthenticated,userDashboardController.dashboardData);
router.get("/total-earnings-bymonth", authMiddleware.isAuthenticated,userDashboardController.TotalEarningsByMonth);
router.get("/listing-properties", authMiddleware.isAuthenticated,userDashboardController.listingProperties);
router.get("/list-by-location", authMiddleware.isAuthenticated,userDashboardController.listByLocations);
router.get("/avg-customer-reviews", authMiddleware.isAuthenticated,userDashboardController.averageCustomerReviews);
router.get("/total-reviews", authMiddleware.isAuthenticated,userDashboardController.totalReviewCount);
router.get("/total-nights", authMiddleware.isAuthenticated,userDashboardController.totalNightsBookedByTraveler);
router.get("/average-nights",authMiddleware.isAuthenticated,userDashboardController.averageNightBookingByTraveler);

module.exports = router;
