const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/submit',  authMiddleware.isAuthenticated, enquiryController.submitEnquiry);

router.get('/retrieve',  authMiddleware.isAuthenticated, enquiryController.getEnquiries);
router.get('/count',  authMiddleware.isAuthenticated, enquiryController.getEnquiryCount);


module.exports = router;
