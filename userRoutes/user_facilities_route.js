const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilitiesController');

router.get('/all',   facilityController.getAllFacilitiesbystatus);

module.exports=router;