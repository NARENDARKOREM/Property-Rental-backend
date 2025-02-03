const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// Route to create a booking
router.post(
  "/create",
  adminMiddleware.isAdmin,
  bookController.createBooking
);

// Route to get booking details by user
// router.get('/myBookings',  bookController.getBookingDetailsByUser);
router.get("/myBookings/all",adminMiddleware.isAdmin, bookController.gettingAllBookings);
router.get("/count",adminMiddleware.isAdmin, bookController.getBookingCountByStatus);

// Route to cancel a booking
router.put("/cancel", adminMiddleware.isAdmin, bookController.cancelBooking);

// Route to get status wise bookings
router.get(
  "/status/:status",
  adminMiddleware.isAdmin,
  bookController.getStatusWiseBookings
);

// change status
router.put(
  "/status/:id",
  adminMiddleware.isAdmin,
  bookController.changeStatus
);

// Route to search bookings by date range
router.post(
  "/search",
  adminMiddleware.isAdmin,
  bookController.searchBookingsByDate
);

router.post("/status/:id",adminMiddleware.isAdmin,bookController.seAllDetails)   
router.get("/export-ical/:propertyId.ics",bookController.exportIcal);
router.post("/import-ical",adminMiddleware.isAdmin,bookController.importIcal);


module.exports = router;   