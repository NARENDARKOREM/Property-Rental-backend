const express = require("express");
const router = express.Router();
const calenderController = require("../userControllers/calender_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/all",
//   authMiddleware.isAuthenticated,
calenderController.getBookedDates
);

module.exports = router;

