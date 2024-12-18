const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/upsert",
  adminMiddleware.isAdmin,
  categoryController.upsertCategory
);
router.get("/all", categoryController.getAllCategories);

router.get("/count", categoryController.getCategoryCount);
router.get("/:id", categoryController.getCategoryById);
router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  categoryController.deleteCategory
);

module.exports = router;
