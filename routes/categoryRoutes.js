const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  }
});
const upload = multer({ storage: storage });



router.post('/upsert', adminMiddleware.isAdmin,  categoryController.upsertCategory);

router.get('/:id', authMiddleware.isAuthenticated, categoryController.getCategoryById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, categoryController.deleteCategory);



module.exports = router;
