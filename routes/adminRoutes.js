const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require("../middlewares/authMiddleware");

router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.get('/userbytoken',authMiddleware.isAuthenticated, adminController.getUserbyToken);
router.put('/update/:id', authMiddleware.isAuthenticated, adminController.updateAdmin);
// Delete admin (soft delete by default, force delete with query param ?forceDelete=true)
router.delete('/delete/:id', authMiddleware.isAuthenticated, adminController.deleteAdmin);
router.get('/all-admins', authMiddleware.isAuthenticated, adminController.getAllAdmins);
router.get('/single-admin/:id', authMiddleware.isAuthenticated, adminController.getAdminById);
router.post('/logout', authMiddleware.isAuthenticated, adminController.logoutAdmin);


module.exports = router;
