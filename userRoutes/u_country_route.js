const express = require("express");
const router = express.Router();
const countryController = require("../userControllers/u_country_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/all",
//   authMiddleware.isAuthenticated,
  countryController.getAllCountry
);

module.exports = router;
