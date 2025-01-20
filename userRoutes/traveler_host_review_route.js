const express = require('express');
const router = express.Router();
const traverlerReviewController = require('../userControllers/traveler_host_review_controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/post-review", authMiddleware.isAuthenticated, traverlerReviewController.travelerHostReview);
router.get("/get-traveler-reviews", traverlerReviewController.getTravelerHostReviews);

module.exports = router;