// routes/countriesRoutes.js
const express = require("express");
const router = express.Router();

const countriesController = require("../controllers/countriesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,
  countriesController.upsertCountry
);
router.get("/all", countriesController.getAllCountries);
router.get("/count", countriesController.getCountryCount);
router.get(
  "/:id",
  // authMiddleware.isAuthenticated,
  countriesController.getCountryById
);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  countriesController.deleteCountry
);
router.get(
  "/property-counts",
  countriesController.fetchCountriesWithPropertyCount
);
router.patch("/toggle-status", countriesController.toggleCountryStatus);

module.exports = router;
