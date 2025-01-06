const express = require("express");
const router = express.Router();
const userBookings = require("../userControllers/u_book_controller");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

router.post(
  "/book",
  authMiddleware.isAuthenticated,
  userBookings.createBooking
);
router.post(
  "/confirm-booking",
  adminMiddleware.isAdmin,
  userBookings.confirmBooking
);
router.post("/check-in",authMiddleware.isAuthenticated, userBookings.userCheckIn);
router.post("/check-out",authMiddleware.isAuthenticated, userBookings.userCheckOut);
router.get(
  "/booking-details",
  authMiddleware.isAuthenticated,
  userBookings.getBookingDetails
);
router.post(
  "/booking-cancel",
  authMiddleware.isAuthenticated,
  userBookings.cancelBooking
);
router.post(
  "/booking-status",
  authMiddleware.isAuthenticated,
  userBookings.getBookingsByStatus
);

router.get(
  "/getMyUserBooking",
  authMiddleware.isAuthenticated,
  userBookings.getMyUserBookings
);
router.get(
  "/getMyUserBookingDetails",
  authMiddleware.isAuthenticated,
  userBookings.getMyUserBookingDetails
);
router.post(
  "/myUserCancelBookings",
  authMiddleware.isAuthenticated,
  userBookings.myUserCancelBookings
);
router.get("/current-bookings", authMiddleware.isAuthenticated,userBookings.currentBookingStatus)

module.exports = router;
