const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userPropertyController = require("../userControllers/u_property_controller");
const upload = require("../config/multer");

router.post("/add",authMiddleware.isHost,upload.array("files", 10),userPropertyController.addProperty);
router.patch("/edit",authMiddleware.isAuthenticated,upload.array("files",10),userPropertyController.editProperty);
router.get(
  "/list",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyList
);

router.post("/types", userPropertyController.getPropertyTypes);

router.post("/u_property_details", userPropertyController.getPropertyDetails);

// Host Added Properties
router.get("/all-properties",authMiddleware.isAuthenticated, userPropertyController.getAllHostAddedProperties);
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
router.get("/properties", userPropertyController.getAllProperties)

module.exports = router;
