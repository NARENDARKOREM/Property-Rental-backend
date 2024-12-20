const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/propertyController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,
  propertyController.upsertProperty
);
router.get("/", propertyController.getAllProperties);
router.get("/count", propertyController.getPropertyCount);
router.get("/:id", propertyController.getPropertyById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  propertyController.deleteProperty
);
router.patch("/toggle-status", propertyController.togglePropertyStatus);

module.exports = router;
