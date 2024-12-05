const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Route to create a booking
router.post('/create', isAuthenticated, bookController.createBooking);

// Route to get booking details by user
router.get('/myBookings', isAuthenticated, bookController.getBookingDetailsByUser);

// Route to cancel a booking
router.put('/cancel/:id', isAuthenticated, bookController.cancelBooking);

// Route to get status wise bookings
router.get('/status/:status', isAuthenticated, bookController.getStatusWiseBookings);

// Route to search bookings by date range
router.post('/search', isAuthenticated, bookController.searchBookingsByDate);

module.exports = router;
