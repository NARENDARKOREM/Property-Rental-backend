const express = require("express");
const { dashboardData, TotalEarningsByMonth } = require("../userControllers/u_dashboard_controller");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/all", authMiddleware.isAuthenticated, dashboardData);
router.get("/total-earnings-bymonth", authMiddleware.isAuthenticated,TotalEarningsByMonth );

module.exports = router;
