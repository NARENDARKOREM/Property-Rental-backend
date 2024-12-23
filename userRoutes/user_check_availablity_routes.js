const express = require("express");
const router = express.Router();
const bookingController = require("../userControllers/user_check_availability_controller");

router.post("/check-availability", bookingController.checkDateAvailability);
router.post("/confirm-booking", bookingController.confirmBooking);

module.exports = router;
