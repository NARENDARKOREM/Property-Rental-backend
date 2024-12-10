const express = require('express');
const router = express.Router();
const paymentListController = require('../controllers/paymentListController'); // Correctly import the controller
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');




router.get('/', adminMiddleware.isAdmin, paymentListController.getAllPayments);
router.get('/:id', adminMiddleware.isAdmin, paymentListController.getPaymentById);
router.post('/create', adminMiddleware.isAdmin, paymentListController.createPayment);
router.post('/update/:id', adminMiddleware.isAdmin,  paymentListController.updatePayment);

router.delete('/delete/:id', adminMiddleware.isAdmin, paymentListController.deletePayment);

module.exports = router;
