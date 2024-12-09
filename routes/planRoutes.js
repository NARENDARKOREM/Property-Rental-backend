const express = require('express');
const router = express.Router();
const { getUserPlans, upsertPlanPurchaseHistory } = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');

// Fetch current user's plans
router.get('/plans', authMiddleware.isAuthenticated, getUserPlans);

// Upsert plan purchase history
router.post('/upsert', authMiddleware.isAuthenticated, upsertPlanPurchaseHistory);

module.exports = router;
