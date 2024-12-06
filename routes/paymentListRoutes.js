const express = require('express');
const router = express.Router();
const paymentListController = require('../controllers/paymentListController'); // Correctly import the controller
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const multer = require('multer');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

router.get('/', authMiddleware.isAuthenticated, paymentListController.getAllPayments);
router.get('/:id', authMiddleware.isAuthenticated, paymentListController.getPaymentById);
router.post('/create', adminMiddleware.isAdmin, upload.single('img'), paymentListController.createPayment);
router.post('/update/:id', adminMiddleware.isAdmin, upload.single('img'), paymentListController.updatePayment);
router.delete('/delete/:id', adminMiddleware.isAdmin, paymentListController.deletePayment);

module.exports = router;
