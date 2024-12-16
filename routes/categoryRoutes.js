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
router.post('/upsert', adminMiddleware.isAdmin,  categoryController.upsertCategory);
router.get('/all', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, categoryController.deleteCategory);

module.exports = router;

