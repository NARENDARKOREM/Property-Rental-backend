const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to create a booking
router.post(
  "/create",
  authMiddleware.isAuthenticated,
  bookController.createBooking
);

// Route to get booking details by user
// router.get('/myBookings',  bookController.getBookingDetailsByUser);
router.get("/myBookings/all", bookController.gettingAllBookings);
router.get("/count", bookController.getBookingCountByStatus);

// Route to cancel a booking
router.put(
  "/cancel/:id",
  // authMiddleware.isAuthenticated,
  bookController.cancelBooking
);

// Route to get status wise bookings
router.get(
  "/status/:status",
  // authMiddleware.isAuthenticated,
  bookController.getStatusWiseBookings
);

// change status
router.put(
  "/status/:id",
  // authMiddleware.isAuthenticated,
  bookController.changeStatus
);

// Route to search bookings by date range
router.post(
  "/search",
  authMiddleware.isAuthenticated,
  bookController.searchBookingsByDate
);

module.exports = router;
