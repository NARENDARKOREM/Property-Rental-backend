const express = require('express');
const router = express.Router();
const refundController = require('../userControllers/u_refund_controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/refund",authMiddleware.isAuthenticated,refundController.travelerBookingAmountRefund)

module.exports = router;