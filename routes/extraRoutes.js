const express = require('express');
const router = express.Router();
const extraController = require('../controllers/extraController');

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

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


router.post('/upsert', adminMiddleware.isAdmin, upload.single('cat_img'), extraController.upsertExtra);
router.get('/',  authMiddleware.isAuthenticated, extraController.getAllExtras);
router.get('/:id',  authMiddleware.isAuthenticated, extraController.getExtraById);
router.delete('/delete/:id', adminMiddleware.isAdmin, extraController.deleteExtra);


module.exports = router;
