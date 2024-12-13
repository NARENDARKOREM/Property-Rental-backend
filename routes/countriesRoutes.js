const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const countriesController = require('../controllers/countriesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');




router.post('/upsert',   countriesController.upsertCountry);
router.get('/all',  countriesController.getAllCountries);
router.get('/:id',  countriesController.getCountryById);
router.delete('/delete/:id', adminMiddleware.isAdmin, countriesController.deleteCountry);


module.exports = router;
