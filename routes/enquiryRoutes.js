const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.post('/submit', isAuthenticated, enquiryController.submitEnquiry);
router.get('/retrieve', isAuthenticated, enquiryController.getEnquiries);

module.exports = router;
