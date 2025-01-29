const express = require("express");
const router = express.Router();
const extraController = require("../controllers/extraController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

// Configure Multer for file uploads

router.post("/upsert",adminMiddleware.isAdmin,upload.single('img'), extraController.upsertExtra);
router.get("/",adminMiddleware.isAdmin, extraController.getAllExtras);
router.get("/count",adminMiddleware.isAdmin, extraController.getExtraImagesCount);
router.get("/:id",adminMiddleware.isAdmin, extraController.getExtraById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  extraController.deleteExtra
);

router.patch("/toggle-status", extraController.toggleExtraImagesStatus);

module.exports = router;
