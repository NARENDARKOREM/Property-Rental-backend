const express = require('express');
const router = express.Router();
const settingController = require('../userControllers/setting_controller');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

router.get("/settings",authMiddleware.isAuthenticated,settingController.SettingAPI);
router.patch('/update-settings',adminMiddleware.isAdmin,settingController.updateSetting)

module.exports = router;