const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/submit',  authMiddleware.isAuthenticated, enquiryController.submitEnquiry);
router.post('/retrieve',   enquiryController.getEnquiries);

module.exports = router;
