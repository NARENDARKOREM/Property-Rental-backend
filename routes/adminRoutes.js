const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require('../middlewares/adminMiddleware');

router.post('/register', adminController.registerAdmin);
router.post('/login', adminController.loginAdmin);
router.get('/userbytoken',adminMiddleware.isAdmin, adminController.getUserbyToken);
router.put('/update/:id', adminMiddleware.isAdmin, adminController.updateAdmin);
// Delete admin (soft delete by default, force delete with query param ?forceDelete=true)
router.delete('/delete/:id', adminMiddleware.isAdmin, adminController.deleteAdmin);
router.get('/all-admins', adminMiddleware.isAdmin, adminController.getAllAdmins);
router.get('/single-admin/:id', adminMiddleware.isAdmin, adminController.getAdminById);
router.post('/logout', adminMiddleware.isAdmin, adminController.logoutAdmin);


module.exports = router;

