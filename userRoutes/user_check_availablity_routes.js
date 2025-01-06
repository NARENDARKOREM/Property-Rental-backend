const express = require("express");
const router = express.Router();
const bookingController = require("../userControllers/user_check_availability_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/check-availability", bookingController.checkDateAvailability);

module.exports = router;
