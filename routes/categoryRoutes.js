const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');






router.post('/upsert', adminMiddleware.isAdmin,  categoryController.upsertCategory);
router.post('/all',  categoryController.getAllCategories);

router.get('/:id', authMiddleware.isAuthenticated, categoryController.getCategoryById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, categoryController.deleteCategory);

module.exports = router;
