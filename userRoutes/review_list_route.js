const express = require("express");
const router = express.Router();
const reviewController = require("../userControllers/review_list_controller");
const authMiddleware = require("../middlewares/authMiddleware");

router.get(
  "/all",
  // authMiddleware.isAuthenticated,
    reviewController.getReviews
);
router.put(
  "/update",
  authMiddleware.isAuthenticated,
    reviewController.updateRating
);

module.exports = router;

