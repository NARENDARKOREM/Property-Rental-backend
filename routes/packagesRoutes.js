const express = require("express");
const router = express.Router();
const packagesController = require("../controllers/packagesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,
  packagesController.upsertPackage
);
router.get("/all",adminMiddleware.isAdmin, packagesController.getAllPackages);
router.get("/count",adminMiddleware.isAdmin, packagesController.getPackagesCount);
router.get("/:id",adminMiddleware.isAdmin, packagesController.getPackageById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  packagesController.deletePackage
);
router.patch("/toggle-status", packagesController.togglePackageStatus);

module.exports = router;
