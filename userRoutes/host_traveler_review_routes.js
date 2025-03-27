const express = require('express');
const router = express.Router();
const hostTravelerReviewController = require('../userControllers/host_traveler_reivew_controller');
const hostMiddleware = require('../middlewares/authMiddleware');

router.post("/post-review", hostMiddleware.isAuthenticated,hostTravelerReviewController.hostTravelerReview );
router.get("/traveler-reviews",hostMiddleware.isAuthenticated, hostTravelerReviewController.getHostTravelerReviews)

module.exports = router;