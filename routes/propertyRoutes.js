const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post("/upsert",upload.single("image"),adminMiddleware.isAdmin,propertyController.upsertProperty);
router.get("/",adminMiddleware.isAdmin, propertyController.getAllProperties);
router.get("/count",adminMiddleware.isAdmin, propertyController.getPropertyCount);
router.get("/:id",adminMiddleware.isAdmin, propertyController.getPropertyById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  propertyController.deleteProperty
);
router.patch("/toggle-status",adminMiddleware.isAdmin, propertyController.togglePropertyStatus);
router.post(
  "/fetch-by-countries",
  propertyController.fetchPropertiesByCountries
);
router.patch("/toggle-panorama",adminMiddleware.isAdmin, propertyController.isPanoramaToggle);

module.exports = router;
