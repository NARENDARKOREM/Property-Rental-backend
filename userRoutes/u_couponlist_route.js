const express = require("express");
const router = express.Router();
const couponController = require("../userControllers/u_couponlist_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/all",
//   authMiddleware.isAuthenticated,
    couponController.getCoupons
);

router.post('/applyCoupon',couponController.applyCoupon);

module.exports = router;