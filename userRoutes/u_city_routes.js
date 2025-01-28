const express = require("express");
const router = express.Router();
const cityController = require("../userControllers/u_city_controller");
const authMiddlware = require('../middlewares/authMiddleware');

router.get("/fetch-cities",authMiddlware.isAuthenticated,cityController.getActiveCities);

module.exports = router;
