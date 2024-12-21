const express = require("express");
const router = express.Router();
const packagesController = require("../controllers/packagesController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  // adminMiddleware.isAdmin,
  packagesController.upsertPackage
);
router.get("/all", packagesController.getAllPackages);
router.get("/count", packagesController.getPackagesCount);
router.get("/:id", packagesController.getPackageById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  packagesController.deletePackage
);
router.patch("/toggle-status", packagesController.togglePackageStatus);

module.exports = router;
