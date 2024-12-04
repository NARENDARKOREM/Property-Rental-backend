const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Route to create a booking
router.post('/create', isAuthenticated, bookController.createBooking);
router.get('/myBookings', isAuthenticated, bookController.getBookingDetailsByUser);
router.put('/cancel/:id', isAuthenticated, bookController.cancelBooking);
router.get('/status/:status', isAuthenticated, bookController.getStatusWiseBookings);
router.post('/search', isAuthenticated, bookController.searchBookingsByDate);

module.exports = router;
