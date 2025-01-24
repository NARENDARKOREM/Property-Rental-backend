const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const couponsController = require("../controllers/couponsController");
const adminMiddleware = require("../middlewares/adminMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "..", "uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
  },
});
const upload = multer({ storage: storage });

router.post("/upsert", adminMiddleware.isAdmin, couponsController.upsertCoupon);

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
