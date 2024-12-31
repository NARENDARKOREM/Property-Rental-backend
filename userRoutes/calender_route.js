const express = require("express");
const router = express.Router();
const calenderController = require("../userControllers/calender_controller");
const authMiddleware = require("../middlewares/authMiddleware");

/**
 * @route GET /users
 * @description Get all users
 * @returns {Array} List of users
 */

router.post(
  "/all",
  authMiddleware.isAuthenticated,
calenderController.getBookedDates
);

module.exports = router;

