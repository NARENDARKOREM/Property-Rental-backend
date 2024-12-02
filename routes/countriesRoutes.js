const express = require('express');
const router = express.Router();
const countriesController = require('../controllers/countriesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/create', authMiddleware.isAuthenticated, adminMiddleware.isAdmin, countriesController.createCountry);
router.get('/all', authMiddleware.isAuthenticated, countriesController.getAllCountries);
router.get('/:id', authMiddleware.isAuthenticated, countriesController.getCountryById);
router.put('/update/:id', authMiddleware.isAuthenticated, adminMiddleware.isAdmin, countriesController.updateCountry);
router.delete('/delete/:id', authMiddleware.isAuthenticated, adminMiddleware.isAdmin, countriesController.deleteCountry);

module.exports = router;
