const express = require("express");
const router = express.Router();
const userBookings = require("../userControllers/u_book_controller");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../config/multer");

router.post("/book",authMiddleware.isAuthenticated,upload.single("id_proof_img") ,userBookings.createBooking);
router.patch("/edit-booking/:book_id",authMiddleware.isAuthenticated,upload.single("id_proof_img") ,userBookings.editBooking);
router.post("/confirm-booking",adminMiddleware.isAdmin,userBookings.confirmBooking);
router.post("/block-date",authMiddleware.isAuthenticated,userBookings.hostBlockBookingProperty);
router.post("/check-in",authMiddleware.isAuthenticated, userBookings.userCheckIn);
router.post("/check-out",authMiddleware.isAuthenticated, userBookings.userCheckOut);
router.post("/booking-details", authMiddleware.isAuthenticated, userBookings.getBookingDetails);
router.post("/booking-cancel", authMiddleware.isAuthenticated, userBookings.cancelBooking);
router.post("/cancel-by-host",authMiddleware.isAuthenticated,userBookings.cancelTravelerBookingByHost)

// Traveller booking status
router.post(
  "/traveler-booking-status",
  authMiddleware.isAuthenticated,
  userBookings.getTravelerBookingsByStatus
);

router.get(
  "/getMyUserBooking",
  authMiddleware.isAuthenticated,
  userBookings.getMyUserBookings
);
router.get(
  "/getMyUserBookingDetails",
  authMiddleware.isAuthenticated,
  userBookings.getMyUserBookingDetails
);
router.post(
  "/myUserCancelBookings",
  authMiddleware.isAuthenticated,
  userBookings.myUserCancelBookings
);

router.post("/host-property-booking-status", authMiddleware.isAuthenticated, userBookings.hostPropertiesBookingStatus)


router.post("/property-booking-status",authMiddleware.isAuthenticated, userBookings.propertyBookingStatus)

module.exports = router;
