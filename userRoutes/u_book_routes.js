const express = require("express");
const router = express.Router();
const userBookings = require("../userControllers/u_book_controller");

router.post("/book", userBookings.createBooking);
router.post("/booking-details", userBookings.getBookingDetails);
router.post("/booking-cancel", userBookings.cancelBooking);
router.post("/status", userBookings.getBookingsByStatus);

router.post("/getMyUserBooking", userBookings.getMyUserBookings);
router.post("/getMyUserBookingDetails", userBookings.getMyUserBookingDetails);
router.post("/myUserCancelBookings", userBookings.myUserCancelBookings);

module.exports = router;
