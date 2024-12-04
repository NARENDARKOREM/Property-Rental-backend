const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Route to get wallet report
router.get('/report', isAuthenticated, walletController.getWalletReport);

// Route to update wallet balance
router.post('/update', isAuthenticated, walletController.updateWalletBalance);

module.exports = router;
