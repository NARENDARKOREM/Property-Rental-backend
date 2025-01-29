const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const couponsController = require("../controllers/couponsController");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post("/upsert", adminMiddleware.isAdmin,upload.single('c_img'), couponsController.upsertCoupon);
router.get("/all", adminMiddleware.isAdmin, couponsController.getAllCoupons);
router.get("/count", adminMiddleware.isAdmin, couponsController.getCouponCount);
router.get("/:id",adminMiddleware.isAdmin, couponsController.getCouponById);

router.delete(
  "/delete/:id",
  adminMiddleware.isAdmin,
  couponsController.deleteCoupon
);
router.patch("/toggle-status",adminMiddleware.isAdmin, couponsController.toggleCouponStatus);

module.exports = router;
