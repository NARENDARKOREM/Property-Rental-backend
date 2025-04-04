const express = require('express');
const router = express.Router();
const settingController = require('../userControllers/setting_controller');
const authMiddleware = require('../middlewares/authMiddleware');

router.get("/settings",authMiddleware.isAuthenticated,settingController.SettingAPI);
router.get('/get-settings',settingController.GetPolicySetting)

module.exports = router;