const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/adminMiddleware');
const cityController = require('../controllers/cityController');
const upload = require('../config/multer');

router.post("/upsert",adminMiddleware.isAdmin,upload.single('img'),cityController.upsertCity);
router.get("/active-cities",adminMiddleware.isAdmin,cityController.getActiveCities);

module.exports = router;