const express = require("express");
const router = express.Router();
const bookingController = require("../userControllers/user_check_availability_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/check-availability", bookingController.checkDateAvailability);
router.post("/confirm-booking", bookingController.confirmBooking);
router.post(
  "/check-in",
  authMiddleware.isAuthenticated,
  bookingController.checkIn
);
router.post(
  "/check-out",
  authMiddleware.isAuthenticated,
  bookingController.checkOut
);
module.exports = router;
