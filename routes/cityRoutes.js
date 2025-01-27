const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/adminMiddleware');
const cityController = require('../controllers/cityController');
const upload = require('../config/multer');

router.post("/upsert",adminMiddleware.isAdmin,upload.single('img'),cityController.upsertCity);
router.get("/active-cities",adminMiddleware.isAdmin,cityController.getCities);
router.patch("/toggle-status",adminMiddleware.isAdmin,cityController.toggleCityStatus);
router.delete("/delete/:id",adminMiddleware.isAdmin, cityController.deleteCity);
router.get("/:id",adminMiddleware.isAdmin,cityController.getCityById);

module.exports = router;