const express = require("express");
const { dashboardData } = require("../userControllers/u_dashboard_controller");
const router = express.Router();

router.get("/all", dashboardData);

module.exports = router;