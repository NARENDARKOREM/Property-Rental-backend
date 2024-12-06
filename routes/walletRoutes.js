const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route to get wallet report
router.get('/report',  authMiddleware.isAuthenticated, walletController.getWalletReport);

// Route to update wallet balance
router.post('/update',  authMiddleware.isAuthenticated, walletController.updateWalletBalance);

module.exports = router;
