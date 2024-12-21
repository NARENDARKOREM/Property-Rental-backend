const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const facilitiesController = require("../controllers/facilitiesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,
  facilitiesController.upsertFacility
);
router.get("/all", facilitiesController.getAllFacilities);
router.get("/count", facilitiesController.getFacilityCount);
router.get("/:id", facilitiesController.getFacilityById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  facilitiesController.deleteFacility
);
router.get("/search/all", facilitiesController.getAllFss);
router.patch("/toggle-status", facilitiesController.toggleFacilityStatus);

module.exports = router;
