const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/upsert', adminMiddleware.isAdmin, staffController.upsertStaff);
router.get('/all', authMiddleware.isAuthenticated, staffController.getAllStaff);

router.delete('/delete/:id', adminMiddleware.isAdmin, staffController.deleteStaff);


module.exports = router;
