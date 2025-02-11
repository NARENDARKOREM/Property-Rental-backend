const express = require('express');
const router = express.Router();
const notificationController = require('../userControllers/u_fetch_notifications_controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get("/fetch-notifications",authMiddleware.isAuthenticated,notificationController.FetchNotifications)

module.exports = router;