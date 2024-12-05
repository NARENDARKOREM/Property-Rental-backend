const express = require('express');
const router = express.Router();
const { requestHost, getNotifications, handleHostRequest } = require('../controllers/hostRequstController');
const { isAuthenticated, isAdmin } = require('../middlewares/authMiddleware');

// Route to send a host request
router.post('/requestHost', isAuthenticated, requestHost);

// Route to get notifications for user or admin
router.get('/', isAuthenticated, getNotifications);

// Route to handle host request (accept/decline)
router.post('/handleHostRequest', isAuthenticated, isAdmin, handleHostRequest);

module.exports = router;
