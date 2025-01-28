const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const facilitiesController = require("../controllers/facilitiesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,upload.single('img'),
  facilitiesController.upsertFacility
);
router.get("/all",adminMiddleware.isAdmin, facilitiesController.getAllFacilities);
router.get("/count",adminMiddleware.isAdmin, facilitiesController.getFacilityCount);
router.get("/:id",adminMiddleware.isAdmin, facilitiesController.getFacilityById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  facilitiesController.deleteFacility
);
router.get("/search/all",adminMiddleware.isAdmin, facilitiesController.getAllFss);
router.patch("/toggle-status",adminMiddleware.isAdmin, facilitiesController.toggleFacilityStatus);

module.exports = router;
