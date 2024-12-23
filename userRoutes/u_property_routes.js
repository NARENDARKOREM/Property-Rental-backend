const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const userPropertyController = require("../userControllers/u_property_controller");

router.post(
  "/add",
  authMiddleware.isAuthenticated,
  userPropertyController.addProperty
);
router.post(
  "/edit",
  authMiddleware.isAuthenticated,
  userPropertyController.editProperty
);
router.get(
  "/list",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyList
);

router.get(
  "/types",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyTypes
);

router.post(
  "/search",
  authMiddleware.isAuthenticated,
  userPropertyController.searchProperty
); // Is not working need to implement
router.post(
  "/u_property_details",
  authMiddleware.isAuthenticated,
  userPropertyController.getPropertyDetails
);

router.get("/all-properties", userPropertyController.getAllProperties);

module.exports = router;
