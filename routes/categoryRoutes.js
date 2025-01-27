const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,upload.single('img'),
  categoryController.upsertCategory
);
router.get("/all",adminMiddleware.isAdmin, categoryController.getAllCategories);

router.get("/count",adminMiddleware.isAdmin, categoryController.getCategoryCount);
router.get("/:id",adminMiddleware.isAdmin, categoryController.getCategoryById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  categoryController.deleteCategory
);
router.patch("/toggle-status",adminMiddleware.isAdmin, categoryController.toggleCategoryStatus);

module.exports = router;
