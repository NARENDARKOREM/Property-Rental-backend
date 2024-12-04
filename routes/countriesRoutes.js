const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const countriesController = require('../controllers/countriesController');
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

router.post('/upsert', authMiddleware.isAuthenticated, adminMiddleware.isAdmin,  countriesController.upsertCountry);
router.get('/all',  countriesController.getAllCountries);
router.get('/:id', authMiddleware.isAuthenticated, countriesController.getCountryById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, adminMiddleware.isAdmin, countriesController.deleteCountry);

module.exports = router;
