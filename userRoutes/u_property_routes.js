const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userPropertyController = require("../userControllers/u_property_controller");
const upload = require("../config/multer");

router.post(
  "/add",
  authMiddleware.isAuthenticated,upload.single("image"),
  userPropertyController.addProperty
);
router.patch(
  "/edit",
  authMiddleware.isAuthenticated,
  upload.single("image"),
  userPropertyController.editProperty
);
router.get(
  "/list",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyList
);

router.post("/types", userPropertyController.getPropertyTypes);

router.post("/u_property_details", userPropertyController.getPropertyDetails);

router.get("/all-properties", userPropertyController.getAllProperties);
router.get("/search", userPropertyController.searchPropertyByLocationAndDate);
router.post("/search-properties", userPropertyController.searchProperties);
router.post("/sort-price/:sort", userPropertyController.getSortedProperties);
router.post(
  "/sort-property-title/:sort",
  userPropertyController.getSortedPropertiestitle
);
router.post(
  "/nearby_properties",
  userPropertyController.nearByProperties
);
router.delete(
  "/delete-property/:propertyId",
  authMiddleware.isAuthenticated,
  userPropertyController.deleteUserProperty
);

module.exports = router;
