const express = require("express");
const router = express.Router();
const bookingController = require("../userControllers/user_check_availability_controller");

router.post("/check-availability", bookingController.checkDateAvailability);
router.post("/confirm-booking", bookingController.confirmBooking);
router.post("/check-in", bookingController.checkIn);
router.post("/check-out", bookingController.checkOut);
module.exports = router;
