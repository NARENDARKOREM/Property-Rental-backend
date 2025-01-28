// routes/countriesRoutes.js
const express = require("express");
const router = express.Router();

const countriesController = require("../controllers/countriesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post("/upsert",adminMiddleware.isAdmin,upload.single('img') ,countriesController.upsertCountry);
router.get("/all",adminMiddleware.isAdmin, countriesController.getAllCountries);
router.get("/count",adminMiddleware.isAdmin, countriesController.getCountryCount);
router.get(
  "/:id",
  adminMiddleware.isAdmin,
  countriesController.getCountryById
);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  countriesController.deleteCountry
);
router.get(
  "/property-counts",
  adminMiddleware.isAdmin,
  countriesController.fetchCountriesWithPropertyCount
);
router.patch("/toggle-status",adminMiddleware.isAdmin, countriesController.toggleCountryStatus);

module.exports = router;
