const express = require('express');
const router = express.Router();
const extraController = require('../controllers/extraController');
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

router.post('/upsert', isAuthenticated, isAdmin, upload.single('cat_img'), extraController.upsertExtra);
router.get('/', isAuthenticated, extraController.getAllExtras);
router.get('/:id', isAuthenticated, extraController.getExtraById);
router.delete('/delete/:id', isAuthenticated, isAdmin, extraController.deleteExtra);

module.exports = router;
