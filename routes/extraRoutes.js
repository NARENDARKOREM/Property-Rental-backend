const express = require("express");
const router = express.Router();
const extraController = require("../controllers/extraController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Configure Multer for file uploads

router.post("/upsert", extraController.upsertExtra);
router.get("/", extraController.getAllExtras);
router.get("/count", extraController.getExtraImagesCount);
router.get("/:id", extraController.getExtraById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  extraController.deleteExtra
);

router.patch("/toggle-status", extraController.toggleExtraImagesStatus);

module.exports = router;
