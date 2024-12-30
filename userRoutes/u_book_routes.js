const express = require("express");
const router = express.Router();
const userBookings = require("../userControllers/u_book_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post(
  "/book",
  authMiddleware.isAuthenticated,
  userBookings.createBooking
);
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
router.get(
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

module.exports = router;
