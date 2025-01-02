const express = require("express");
const { dashboardData } = require("../userControllers/u_dashboard_controller");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/all", authMiddleware.isAuthenticated, dashboardData);

module.exports = router;
