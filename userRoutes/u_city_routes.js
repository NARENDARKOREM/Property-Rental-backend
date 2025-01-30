const express = require("express");
const router = express.Router();
const cityController = require("../userControllers/u_city_controller");
const authMiddlware = require('../middlewares/authMiddleware');

router.post("/fetch-cities",cityController.getActiveCities);

module.exports = router;
