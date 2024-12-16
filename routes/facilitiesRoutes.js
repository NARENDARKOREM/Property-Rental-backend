const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const facilitiesController = require('../controllers/facilitiesController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', adminMiddleware.isAdmin,  facilitiesController.upsertFacility);
router.get('/all',  facilitiesController.getAllFacilities);
router.get('/count',  facilitiesController.getFacilityCount);
router.get('/:id', authMiddleware.isAuthenticated, facilitiesController.getFacilityById);
router.delete('/delete/:id', adminMiddleware.isAdmin, facilitiesController.deleteFacility);


module.exports = router;
