const express = require('express');
const router = express.Router();
const { requestHost, getNotifications, handleHostRequest } = require('../controllers/hostRequstController');
const authMiddleware = require('../middlewares/authMiddleware');

const adminMiddleware = require('../middlewares/adminMiddleware');

// Route to send a host request
router.post('/requestHost',  authMiddleware.isAuthenticated, requestHost);

// Route to get notifications for user or admin
router.get('/',  authMiddleware.isAuthenticated, getNotifications);

// Route to handle host request (accept/decline)
router.post('/handleHostRequest', adminMiddleware.isAdmin, handleHostRequest);


module.exports = router;
