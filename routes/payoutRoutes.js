const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const authMiddleware = require('../middlewares/authMiddleware');

// Fetch current user's payout settings
router.get('/', authMiddleware.isAuthenticated, payoutController.getPayoutSettingsByUser);

// Upsert payout setting
router.post('/upsert', authMiddleware.isAuthenticated, payoutController.upsertPayoutSetting);

// get all 
router.get('/all',authMiddleware.isAuthenticated,payoutController.getAllPayoutList)

module.exports = router;
