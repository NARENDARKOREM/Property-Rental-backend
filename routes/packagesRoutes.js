const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const packagesController = require('../controllers/packagesController');
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

router.post('/upsert',  packagesController.upsertPackage);
router.get('/all',  packagesController.getAllPackages);
router.get('/:id',  packagesController.getPackageById);
router.delete('/delete/:id',adminMiddleware.isAdmin, packagesController.deletePackage);

module.exports = router;
