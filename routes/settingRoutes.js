const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const multer = require('multer');



router.get('/', adminMiddleware.isAdmin, settingController.getSetting);
router.put('/update/:id', adminMiddleware.isAdmin,  settingController.updateSetting);

module.exports = router;
