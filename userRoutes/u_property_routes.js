const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userPropertyController = require("../userControllers/u_property_controller");

router.post(
  "/add",
  authMiddleware.isAuthenticated,
  userPropertyController.addProperty
);
router.patch(
  "/edit",
  authMiddleware.isAuthenticated,
  userPropertyController.editProperty
);
router.get(
  "/list",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyList
);

router.post("/types", userPropertyController.getPropertyTypes);

router.post("/u_property_details", userPropertyController.getPropertyDetails);

router.get("/all-properties",authMiddleware.isAuthenticated, userPropertyController.getAllProperties);
router.get("/search", userPropertyController.searchPropertyByLocationAndDate);
router.post("/search-properties", userPropertyController.searchProperties);
router.post("/sort-price/:sort", userPropertyController.getSortedProperties);
router.post(
  "/sort-property-title/:sort",
  userPropertyController.getSortedPropertiestitle
);

module.exports = router;
