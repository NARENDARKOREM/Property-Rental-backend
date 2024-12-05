const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', authMiddleware.isAdminOrHost, staffController.upsertStaff);
router.get('/all', authMiddleware.isAuthenticated, staffController.getAllStaff);
router.get('/:id', authMiddleware.isAuthenticated, staffController.getStaffById);
router.delete('/delete/:id', authMiddleware.isAuthenticated, adminMiddleware.isAdmin, staffController.deleteStaff);

module.exports = router;
