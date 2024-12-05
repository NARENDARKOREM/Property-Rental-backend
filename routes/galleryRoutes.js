const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/upsert', isAuthenticated, isAdmin, upload.single('cat_img'), galleryController.upsertGallery);
router.get('/', isAuthenticated, galleryController.getAllGalleries);
router.get('/:id', isAuthenticated, galleryController.getGalleryById);
router.delete('/delete/:id', isAuthenticated, isAdmin, galleryController.deleteGallery);

module.exports = router;
